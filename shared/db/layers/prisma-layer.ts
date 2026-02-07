import { Context, Effect, Layer } from "effect";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../client";

/**
 * Prisma Client サービスタグ
 *
 * Effect プログラム内で PrismaClient を依存性として要求するための Tag
 */
export class PrismaService extends Context.Tag("PrismaService")<
  PrismaService,
  PrismaClient
>() {}

/**
 * Prisma Client Layer
 *
 * シングルトン PrismaClient インスタンスを Effect コンテキストに提供する Layer
 *
 * @example
 * const program = Effect.gen(function* () {
 *   const db = yield* PrismaService;
 *   const users = await db.user.findMany();
 *   return users;
 * }).pipe(Effect.provide(PrismaLayer));
 */
export const PrismaLayer = Layer.succeed(PrismaService, prisma);

/**
 * Prisma Client を取得する Effect
 *
 * @example
 * const program = Effect.gen(function* () {
 *   const db = yield* getPrismaClient();
 *   const users = await db.user.findMany();
 *   return users;
 * }).pipe(Effect.provide(PrismaLayer));
 */
export const getPrismaClient = () => PrismaService;
