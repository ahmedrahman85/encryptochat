// Helper functions for end-to-end encryption using Web Crypto API

// Generate a new key pair
export async function generateKeyPair() {
    try {
      // Generate the key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
      );
  
      // Export the public key to a format that can be stored in the database
      const publicKeyExported = await window.crypto.subtle.exportKey(
        "spki", 
        keyPair.publicKey
      );
  
      // Convert ArrayBuffer to base64 string for storage
      const publicKeyString = arrayBufferToBase64(publicKeyExported);
      
      // Store private key securely in localStorage
      const privateKeyExported = await window.crypto.subtle.exportKey(
        "pkcs8", 
        keyPair.privateKey
      );
      const privateKeyString = arrayBufferToBase64(privateKeyExported);
      localStorage.setItem('privateKey', privateKeyString);
      
      return {
        publicKey: publicKeyString,
        privateKey: privateKeyString
      };
    } catch (error) {
      console.error("Error generating key pair:", error);
      throw error;
    }
  }
  
  // Retrieve stored private key and import it for use
  export async function getPrivateKey() {
    try {
      const privateKeyString = localStorage.getItem('privateKey');
      if (!privateKeyString) {
        throw new Error("Private key not found");
      }
      
      const privateKeyData = base64ToArrayBuffer(privateKeyString);
      
      return await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyData,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false, // not extractable
        ["decrypt"]
      );
    } catch (error) {
      console.error("Error retrieving private key:", error);
      throw error;
    }
  }
  
  // Import a public key from base64 string
  export async function importPublicKey(publicKeyString) {
    try {
      const publicKeyData = base64ToArrayBuffer(publicKeyString);
      
      return await window.crypto.subtle.importKey(
        "spki",
        publicKeyData,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false, // not extractable
        ["encrypt"]
      );
    } catch (error) {
      console.error("Error importing public key:", error);
      throw error;
    }
  }
  
  // Encrypt a message with a recipient's public key
  export async function encryptMessage(message, publicKeyString) {
    try {
      // First get the public key object
      const publicKey = await importPublicKey(publicKeyString);
      
      // For larger messages, we'll use a hybrid approach:
      // 1. Generate a random symmetric key
      const symmetricKey = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true, // extractable
        ["encrypt", "decrypt"]
      );
      
      // 2. Encrypt the message with the symmetric key
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedMessage = new TextEncoder().encode(message);
      
      const encryptedMessage = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        symmetricKey,
        encodedMessage
      );
      
      // 3. Encrypt the symmetric key with the recipient's public key
      const exportedSymKey = await window.crypto.subtle.exportKey(
        "raw",
        symmetricKey
      );
      
      const encryptedSymKey = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        publicKey,
        exportedSymKey
      );
      
      // 4. Package everything together
      const result = {
        encryptedMessage: arrayBufferToBase64(encryptedMessage),
        encryptedSymKey: arrayBufferToBase64(encryptedSymKey),
        iv: arrayBufferToBase64(iv),
      };
      
      // Return as a JSON string
      return JSON.stringify(result);
    } catch (error) {
      console.error("Error encrypting message:", error);
      throw error;
    }
  }
  
  // Decrypt a message with the user's private key
  export async function decryptMessage(encryptedPackage) {
    try {
      // Parse the encrypted package
      const { encryptedMessage, encryptedSymKey, iv } = JSON.parse(encryptedPackage);
      
      // Get the private key
      const privateKey = await getPrivateKey();
      
      // 1. Decrypt the symmetric key
      const symKeyData = await window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        privateKey,
        base64ToArrayBuffer(encryptedSymKey)
      );
      
      // 2. Import the symmetric key
      const symmetricKey = await window.crypto.subtle.importKey(
        "raw",
        symKeyData,
        {
          name: "AES-GCM",
          length: 256,
        },
        false, // not extractable
        ["decrypt"]
      );
      
      // 3. Decrypt the message
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: base64ToArrayBuffer(iv),
        },
        symmetricKey,
        base64ToArrayBuffer(encryptedMessage)
      );
      
      // 4. Decode the message
      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error("Error decrypting message:", error);
      return "[Encryption error: Could not decrypt message]";
    }
  }
  
  // Helper function to convert ArrayBuffer to Base64 string
  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  // Helper function to convert Base64 string to ArrayBuffer
  function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }