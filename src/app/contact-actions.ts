"use server";

import { deliverContact } from "@/lib/contact-mail";

export async function submitContact(input: unknown) {
  return deliverContact(input);
}
