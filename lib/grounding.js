export const FALLBACK_RESPONSE =
  "I don't have that information right now. Please contact support at support@brightcart.com.";

const SUPPORTED_TOPICS = [
  "brightcart",
  "product",
  "products",
  "eco friendly",
  "eco-friendly",
  "kitchen",
  "reusable",
  "household",
  "cleaning",
  "gift",
  "gift bundle",
  "gift bundles",
  "bamboo bottle",
  "eco kitchen starter kit",
  "sustainable cleaning combo",
  "price",
  "pricing",
  "cost",
  "shipping",
  "free shipping",
  "delivery",
  "deliver",
  "refund",
  "return",
  "cancel",
  "cancellation",
  "working hours",
  "hours",
  "contact",
  "email",
  "support",
  "payment",
  "payments",
  "cash on delivery",
  "cod",
  "bulk",
  "order",
  "orders",
  "tracking",
  "track",
  "india",
];

const UNSUPPORTED_TOPICS = [
  "laptop",
  "laptops",
  "computer",
  "computers",
  "mobile phone",
  "mobile phones",
  "smartphone",
  "smartphones",
  "television",
  "televisions",
  "tv",
  "cars",
  "car",
  "insurance",
  "weather",
  "restaurant",
  "restaurants",
  "politics",
  "coding",
  "code",
  "python",
  "javascript",
  "medical",
  "doctor",
  "personal advice",
  "sports",
  "stock market",
  "stocks",
  "prime minister",
  "office address",
  "address",
  "phone number",
  "phone",
  "mobile number",
  "discount",
  "coupon",
];

const FALLBACK_NORMALIZED = normalizeText(FALLBACK_RESPONSE);

export function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9@.\s₹'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAnyTerm(text, terms) {
  const normalized = normalizeText(text);

  return terms.some((term) => {
    const normalizedTerm = normalizeText(term);
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}(?=[^a-z0-9]|$)`).test(
      normalized,
    );
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getFallbackAnswer() {
  return FALLBACK_RESPONSE;
}

export function containsSupportedTopic(message) {
  return containsAnyTerm(message, SUPPORTED_TOPICS);
}

export function containsUnsupportedTopic(message) {
  return containsAnyTerm(message, UNSUPPORTED_TOPICS);
}

export function isQuestionRelevantToKnowledgeBase(message) {
  if (!message || containsUnsupportedTopic(message)) {
    return false;
  }

  return containsSupportedTopic(message);
}

function getAllowedNumbersFromKnowledgeBase(knowledgeBase) {
  const serialized = JSON.stringify(knowledgeBase);
  return new Set(serialized.match(/\d+/g) || []);
}

function getAllowedPricesFromKnowledgeBase(knowledgeBase) {
  const serialized = JSON.stringify(knowledgeBase);
  const priceMatches = serialized.match(/₹\s?\d[\d,]*/g) || [];

  return new Set(
    priceMatches.map((price) => normalizeText(price).replace(/\s/g, "")),
  );
}

function responseUsesOnlyKnownPrices(response, knowledgeBase) {
  const allowedPrices = getAllowedPricesFromKnowledgeBase(knowledgeBase);
  const prices = response.match(/₹\s?\d[\d,]*|rs\.?\s?\d[\d,]*/gi) || [];

  return prices.every((price) => {
    const normalizedPrice = normalizeText(price)
      .replace(/^rs\.?\s?/, "₹")
      .replace(/\s/g, "");

    return allowedPrices.has(normalizedPrice);
  });
}

function responseUsesOnlyKnownNumbers(response, knowledgeBase) {
  const allowedNumbers = getAllowedNumbersFromKnowledgeBase(knowledgeBase);
  const numbers = response.match(/\d+/g) || [];

  return numbers.every((number) => allowedNumbers.has(number));
}

function responseUsesOnlyKnownEmail(response, knowledgeBase) {
  const emails = response.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
  const allowedEmail = knowledgeBase.company.contactEmail.toLowerCase();

  return emails.every((email) => email.toLowerCase() === allowedEmail);
}

export function validateAIResponse(response, knowledgeBase) {
  const reply = typeof response === "string" ? response.trim() : "";

  if (!reply) {
    return false;
  }

  if (normalizeText(reply) === FALLBACK_NORMALIZED) {
    return true;
  }

  if (containsUnsupportedTopic(reply)) {
    return false;
  }

  if (!containsSupportedTopic(reply)) {
    return false;
  }

  if (!responseUsesOnlyKnownEmail(reply, knowledgeBase)) {
    return false;
  }

  if (!responseUsesOnlyKnownPrices(reply, knowledgeBase)) {
    return false;
  }

  if (!responseUsesOnlyKnownNumbers(reply, knowledgeBase)) {
    return false;
  }

  return true;
}
