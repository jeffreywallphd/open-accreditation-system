import { NotFoundError, ValidationError } from '../../shared/kernel/errors.js';

function validateRequired(body, fields) {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new ValidationError(`${field} is required`);
    }
  }
}

function toResponse(data) {
  return { statusCode: 200, data };
}

function toCreatedResponse(data) {
  return { statusCode: 201, data };
}

function toErrorResponse(error) {
  if (error instanceof ValidationError) {
    return { statusCode: 400, error: error.message };
  }
  if (error instanceof NotFoundError) {
    return { statusCode: 404, error: error.message };
  }
  return { statusCode: 500, error: error.message };
}

export function createAccreditationFrameworksApi(service) {
  return {
    createAccreditor: async (body) => {
      try {
        validateRequired(body, ['name', 'code']);
        return toCreatedResponse(await service.createAccreditor(body));
      } catch (error) {
        return toErrorResponse(error);
      }
    },
    createFramework: async (body) => {
      try {
        validateRequired(body, ['accreditorId', 'name', 'code']);
        return toCreatedResponse(await service.createFramework(body));
      } catch (error) {
        return toErrorResponse(error);
      }
    },
    createFrameworkVersion: async (body) => {
      try {
        validateRequired(body, ['frameworkId', 'versionTag']);
        return toCreatedResponse(await service.createFrameworkVersion(body));
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  };
}
