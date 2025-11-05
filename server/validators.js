import Joi from "joi";

export const validateBasket = (data) => {
    const schema = Joi.object({complete_url: Joi.string().uri().required(), cancel_url: Joi.string().uri().required(), custom: Joi.object().optional()});
    return schema.validate(data);
};

export const validatePackage = (data) => {
    const schema = Joi.object({package_id: Joi.number().integer().positive().required(), quantity: Joi.number().integer().min(1).max(100).default(1), type: Joi.string().valid("single", "subscription").default("single"), variable_data: Joi.object().optional()});
    return schema.validate(data);
};

export const validateProductName = (name) => {
    const schema = Joi.string().min(1).max(500).required();
    return schema.validate(name);
};

export const validateBasketIdent = (ident) => {
    const schema = Joi.string().pattern(/^[a-zA-Z0-9\-]+$/).min(10).max(100).required();
    return schema.validate(ident);
};

export const validateReturnUrl = (url) => {
    const schema = Joi.string().uri().required();
    return schema.validate(url);
};