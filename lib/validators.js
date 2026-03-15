export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex =
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
};

export const minLength = (value, min) => {
  return value && value.length >= min;
};

export const maxLength = (value, max) => {
  return !value || value.length <= max;
};

export const isValidSlug = (slug) => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateProductForm = (data) => {
  const errors = {};
  if (!isRequired(data.name)) errors.name = "Product name is required";
  if (!isRequired(data.slug)) {
    errors.slug = "Slug is required";
  } else if (!isValidSlug(data.slug)) {
    errors.slug = "Slug must be lowercase with hyphens only";
  }
  if (!data.mainImage) errors.mainImage = "Main image is required";
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateInquiryForm = (data) => {
  const errors = {};
  if (!isRequired(data.name)) errors.name = "Name is required";
  if (!isRequired(data.email)) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }
  if (!isRequired(data.message)) {
    errors.message = "Message is required";
  } else if (!minLength(data.message, 10)) {
    errors.message = "Message must be at least 10 characters";
  }
  if (!isRequired(data.projectType))
    errors.projectType = "Project type is required";
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateContactForm = (data) => {
  const errors = {};
  if (!isRequired(data.name)) errors.name = "Name is required";
  if (!isRequired(data.email)) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }
  if (!isRequired(data.subject)) errors.subject = "Subject is required";
  if (!isRequired(data.message)) errors.message = "Message is required";
  return { isValid: Object.keys(errors).length === 0, errors };
};
