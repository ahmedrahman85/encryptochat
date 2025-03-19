import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    content: v.string(), // Encrypted message content
    sender: v.id("users"), // Reference to the sender
    recipient: v.id("users"), // Reference to the recipient (for direct messages)
    createdAt: v.number(), // Timestamp
  }).index("bySenderAndTime", ["sender", "createdAt"])
    .index("byRecipientAndTime", ["recipient", "createdAt"]),
  
  users: defineTable({
    name: v.string(), // Username
    publicKey: v.string(), // Public key for encryption
    lastSeen: v.number(), // Last activity timestamp
  }).index("byName", ["name"]),
});