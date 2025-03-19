import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Register a new user with their public key
export const register = mutation({
  args: { 
    name: v.string(), 
    publicKey: v.string() 
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("byName", (q) => q.eq("name", args.name))
      .first();
    
    if (existingUser) {
      throw new Error("Username already taken");
    }
    
    const userId = await ctx.db.insert("users", {
      name: args.name,
      publicKey: args.publicKey,
      lastSeen: Date.now(),
    });
    
    return userId;
  },
});

// Get a user by their name
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("byName", (q) => q.eq("name", args.name))
      .first();
  },
});

// Get a user by their ID
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List all users
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Update the last seen timestamp for a user
export const updateLastSeen = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastSeen: Date.now(),
    });
  },
});