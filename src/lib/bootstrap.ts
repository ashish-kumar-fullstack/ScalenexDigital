import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import * as models from "./models";
import { passwordSchema } from "./validation";
import { defaultTiers } from "./commission";

export async function bootstrapDatabase() {
  const email = z
    .email()
    .parse(process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase());
  await db();
  for (const model of Object.values(models)) {
    await model.createCollection();
    await model.createIndexes();
  }
  let admin = await models.User.findOne({ email });
  let created = false;
  if (!admin) {
    const password = passwordSchema.parse(process.env.INITIAL_ADMIN_PASSWORD);
    try {
      admin = await models.User.create({
        name: "ScaleNex Digital Admin",
        email,
        passwordHash: await hash(password, 12),
        role: "ADMIN",
        status: "ACTIVE",
        mustChangePassword: true,
      });
      created = true;
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      admin = await models.User.findOne({ email });
    }
  }
  if (!admin || admin.role !== "ADMIN")
    throw new Error(
      "INITIAL_ADMIN_EMAIL belongs to a non-admin account; choose a different email.",
    );
  const rulesCreated = !(await models.CommissionRule.exists({ active: true }));
  // Stable IDs make simultaneous initialization safe; existing rules are never overwritten.
  // Complete a partial default set after an interrupted initialization as well.
  const initialIds = defaultTiers.map(
    (_, i) => `00000000000000000000000${i + 1}`,
  );
  const initialRules = await models.CommissionRule.exists({
    _id: { $in: initialIds },
  });
  if (rulesCreated || initialRules) {
    for (const [index, tier] of defaultTiers.entries()) {
      await models.CommissionRule.updateOne(
        { _id: initialIds[index] },
        {
          $setOnInsert: {
            ...tier,
            active: true,
            effectiveFrom: new Date(),
            createdBy: admin._id,
            updatedBy: admin._id,
          },
        },
        { upsert: true },
      );
    }
  }
  return { created, rulesCreated };
}
