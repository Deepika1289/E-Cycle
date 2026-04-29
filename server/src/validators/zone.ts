import * as Joi from 'joi';

export const validateZone = (zone: any) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    description: Joi.string().trim(),
    boundary: Joi.object({
      type: Joi.string().valid('Polygon').required(),
      coordinates: Joi.array().items(
        Joi.array().items(
          Joi.array().items(Joi.number()).min(2).max(2)
        ).min(3)
      ).required()
    }).required(),
    center: Joi.object({
      type: Joi.string().valid('Point').required(),
      coordinates: Joi.array().items(Joi.number()).length(2).required()
    }).required(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
    cycleCapacity: Joi.number().integer().min(1).required(),
    manager: Joi.string().hex().length(24)
  });

  return schema.validate(zone);
};