"use server";
import { registerInfluencer } from "@/lib/registration";
export async function submitRegistration(input: unknown) {
  return registerInfluencer(input);
}
