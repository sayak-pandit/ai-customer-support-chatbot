# BrightCart AI Customer Support Chatbot

Version 2 upgrades the original portfolio chatbot into a **strictly grounded customer support assistant** for BrightCart, a fictional online store for eco-friendly home and kitchen products.

The assistant answers only from a fixed local knowledge base. Unsupported questions return the required fallback response instead of asking OpenAI to reason about missing information.

## Tech Stack

- Next.js 16 App Router
- React 19
- JavaScript
- Tailwind CSS 4
- Official OpenAI JavaScript SDK
- OpenAI Responses API with `gpt-4.1-mini`
- Vercel-ready environment variable setup

## Version 2 Features

- Deterministic backend grounding before OpenAI is called
- Unsupported questions skip OpenAI completely
- Strict system prompt that forbids inference and invented facts
- Backend response validation after OpenAI replies
- Fixed fallback response for unsupported or ungrounded answers
- Responsive SaaS-style chat interface
- Mobile-friendly Send and example-question buttons
- Loading indicator while the assistant responds
- Friendly error handling for API or configuration failures
- API key kept server-side in `.env.local`

## Folder Structure

```text
project/
├── app/
│   ├── api/chat/route.js    # Chat API route with grounding and OpenAI call
│   ├── globals.css          # Tailwind import and minimal global styles
│   ├── layout.js            # App shell and metadata
│   └── page.js              # Chatbot frontend
├── data/
│   └── knowledgeBase.js     # Fixed BrightCart business facts
├── lib/
│   └── grounding.js         # Deterministic topic checks and response validation
├── .env.example             # Environment variable template
└── README.md
```

## How Grounding Works

1. The API validates the incoming message.
2. `lib/grounding.js` checks whether the question matches supported BrightCart topics.
3. If the question contains unsupported topics such as laptops, phones, weather, coding, address, or phone number, the API returns the fallback immediately.
4. OpenAI is called only for clearly supported BrightCart questions.
5. The OpenAI response is checked again for unsupported terms, unknown emails, unknown prices, or unknown numbers.
6. If validation fails, the API replaces the response with the fallback.

Required fallback:

> I don't have that information right now. Please contact support at [support@brightcart.com](mailto:support@brightcart.com).

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root:

```env
OPENAI_API_KEY=your_real_openai_api_key
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## OpenAI API Key Usage

The key is used only inside `app/api/chat/route.js` on the server. It is never exposed to browser code. API usage may incur charges on your OpenAI account.

## Verification Commands

```bash
npm run lint
npm run build
```

## Required Supported Test Questions

1. What products do you sell?
2. What is the price of bamboo bottle?
3. Do you offer free shipping?
4. What is your refund policy?
5. Do you support bulk orders?
6. Can I cancel my order?
7. What are your working hours?

## Required Unsupported Test Questions

Each of these should return the exact fallback and skip OpenAI:

1. Do you sell laptops?
2. Do you sell mobile phones?
3. Can you write Python code?
4. What's today's weather?
5. Suggest a restaurant.
6. What is your office address?
7. Do you have a phone number?
8. Who is the Prime Minister of India?

## Additional Customer Test Questions

1. How long does standard delivery take?
2. Do you deliver outside India?
3. How can I track my order?
4. Do you accept Cash on Delivery?
5. Which payment methods are supported?
6. How can I contact support?
7. What does the sustainable cleaning combo cost?
8. How much is a gift bundle?
9. Can I return an opened product?
10. Do you offer student discounts?
11. Do you sell televisions?
12. Can you help with medical advice?

## Deploying to Vercel

1. Push the project to a GitHub, GitLab, or Bitbucket repository.
2. Sign in to [Vercel](https://vercel.com) and import the project.
3. Confirm Vercel detects Next.js.
4. Add `OPENAI_API_KEY` under **Project Settings -> Environment Variables**.
5. Deploy the project.
6. Test one supported and one unsupported question on the live URL.

Do not upload `.env.local`; configure the key through Vercel's encrypted environment variables.

## Portfolio Use Case

This project demonstrates a practical full-stack AI pattern: polished UI, server-side API security, deterministic grounding, model prompting, defensive validation, mobile usability, and deployment readiness. It is useful for explaining how an AI feature can be constrained to approved business information instead of behaving like a general-purpose chatbot.
