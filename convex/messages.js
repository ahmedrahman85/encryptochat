import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send a new message (already encrypted on the client)
export const send = mutation({
  args: { 
    content: v.string(), // This will be the encrypted message
    senderId: v.id("users"),
    recipientId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Store the encrypted message
    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      sender: args.senderId,
      recipient: args.recipientId,
      createdAt: Date.now(),
    });
    
    // Update the last seen timestamp for the sender
    await ctx.db.patch(args.senderId, {
      lastSeen: Date.now(),
    });
    
    return messageId;
  },
});

// Get all messages between two users
export const getConversation = query({
  args: { 
    user1Id: v.id("users"),
    user2Id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get messages sent from user1 to user2
    const sentMessages = await ctx.db
      .query("messages")
      .withIndex("bySenderAndTime", (q) => q.eq("sender", args.user1Id))
      .filter((q) => q.eq(q.field("recipient"), args.user2Id))
      .collect();
    
    // Get messages sent from user2 to user1
    const receivedMessages = await ctx.db
      .query("messages")
      .withIndex("bySenderAndTime", (q) => q.eq("sender", args.user2Id))
      .filter((q) => q.eq(q.field("recipient"), args.user1Id))
      .collect();
    
    // Combine and sort all messages by timestamp
    return [...sentMessages, ...receivedMessages]
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Get the most recent message for each conversation a user is part of
export const getRecentConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all messages where the user is sender or recipient
    const sentMessages = await ctx.db
      .query("messages")
      .withIndex("bySenderAndTime", (q) => q.eq("sender", args.userId))
      .collect();
    
    const receivedMessages = await ctx.db
      .query("messages")
      .withIndex("byRecipientAndTime", (q) => q.eq("recipient", args.userId))
      .collect();
    
    // Combine all messages
    const allMessages = [...sentMessages, ...receivedMessages];
    
    // Group by conversation partner
    const conversations = {};
    for (const message of allMessages) {
      const partnerId = message.sender === args.userId ? message.recipient : message.sender;
      
      // Keep only the most recent message for each conversation
      if (!conversations[partnerId] || message.createdAt > conversations[partnerId].createdAt) {
        conversations[partnerId] = message;
      }
    }
    
    // Return as array sorted by timestamp (most recent first)
    return Object.values(conversations)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});