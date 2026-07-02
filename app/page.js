"use client";

import { useEffect, useRef, useState } from "react";

const exampleQuestions = [
  "What products do you sell?",
  "What is the price of the eco kitchen starter kit?",
  "Do you offer free shipping?",
  "How long does delivery take?",
  "What is your refund policy?",
  "Do you accept Cash on Delivery?",
  "Can I cancel my order?",
  "Do you support bulk orders?",
];

const welcomeMessage = {
  role: "assistant",
  content:
    "Hi! I'm BrightCart's support assistant. Ask me about our products, prices, shipping, refunds, or orders.",
};

function SupportIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 10.5h8M8 14h5m8-2a9 9 0 1 1-4.03-7.5A9 9 0 0 1 21 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageContent({ content }) {
  const emailPattern =
    /(\[support@brightcart\.com\]\(mailto:support@brightcart\.com\)|support@brightcart\.com)/g;
  const parts = content.split(emailPattern);

  return parts.map((part, index) => {
    if (part.includes("support@brightcart.com")) {
      return (
        <a
          key={`${part}-${index}`}
          href="mailto:support@brightcart.com"
          className="pointer-events-auto font-semibold underline underline-offset-2"
        >
          support@brightcart.com
        </a>
      );
    }

    return part;
  });
}

export default function Home() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef("");
  const isLoadingRef = useRef(false);
  const lastNativeActionRef = useRef({ key: "", time: 0 });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  function shouldIgnoreDuplicateAction(key, eventTime) {
    const now = eventTime || 0;
    const previous = lastNativeActionRef.current;

    if (previous.key === key && now - previous.time < 700) {
      return true;
    }

    lastNativeActionRef.current = { key, time: now };
    return false;
  }

  async function sendMessage(messageText) {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isLoadingRef.current) return;

    setMessages((current) => [
      ...current,
      { role: "user", content: trimmedMessage },
    ]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The request could not be completed.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ]);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Sorry, something went wrong. Please try again in a moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (shouldIgnoreDuplicateAction("send", event.timeStamp)) return;

    sendMessage(input);
  }

  function handleExampleClick(event, question) {
    if (shouldIgnoreDuplicateAction(`example:${question}`, event.timeStamp)) {
      return;
    }

    sendMessage(question);
  }

  useEffect(() => {
    function getActionElement(target) {
      if (!(target instanceof Element)) return null;
      return target.closest("[data-chat-action]");
    }

    function handleNativeAction(event) {
      const actionElement = getActionElement(event.target);
      if (!actionElement || isLoadingRef.current) return;

      const action = actionElement.dataset.chatAction;

      if (action === "send") {
        if (shouldIgnoreDuplicateAction("send", event.timeStamp)) return;

        event.preventDefault();
        sendMessage(inputRef.current);
        return;
      }

      if (action === "example") {
        const question = actionElement.dataset.question || "";
        if (
          !question ||
          shouldIgnoreDuplicateAction(`example:${question}`, event.timeStamp)
        ) {
          return;
        }

        event.preventDefault();
        sendMessage(question);
      }
    }

    document.addEventListener("pointerup", handleNativeAction, true);
    document.addEventListener("touchend", handleNativeAction, true);
    document.addEventListener("click", handleNativeAction, true);

    return () => {
      document.removeEventListener("pointerup", handleNativeAction, true);
      document.removeEventListener("touchend", handleNativeAction, true);
      document.removeEventListener("click", handleNativeAction, true);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#f4f7f6] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="pointer-events-auto relative z-10 mx-auto max-w-5xl">
        <header className="pointer-events-auto mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <SupportIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                BrightCart Support
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                How can we help?
              </h1>
            </div>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm">
            <span
              className="pointer-events-none h-2 w-2 rounded-full bg-emerald-500"
              aria-hidden="true"
            />
            AI assistant online
          </div>
        </header>

        <div className="pointer-events-auto grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="pointer-events-auto relative z-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <SupportIcon />
                </div>
                <div>
                  <h2 className="font-semibold">BrightCart Assistant</h2>
                  <p className="text-xs text-slate-500">
                    Products, shipping, refunds, and orders
                  </p>
                </div>
              </div>
            </div>

            <div
              className="pointer-events-auto h-[430px] overflow-y-auto bg-slate-50/70 p-4 sm:h-[500px] sm:p-6"
              aria-live="polite"
            >
              <div className="space-y-5">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                        message.role === "user"
                          ? "rounded-br-md bg-emerald-600 text-white shadow-sm"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                      }`}
                    >
                      <MessageContent content={message.content} />
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="sr-only">BrightCart is responding</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 sm:p-5">
              {error && (
                <div
                  role="alert"
                  className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="pointer-events-auto flex items-end gap-3"
              >
                <label htmlFor="message" className="sr-only">
                  Ask BrightCart a question
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage(event.currentTarget.value);
                    }
                  }}
                  rows="1"
                  maxLength="500"
                  enterKeyHint="send"
                  placeholder="Ask BrightCart..."
                  disabled={isLoading}
                  data-testid="chat-input"
                  className="pointer-events-auto min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={isLoading}
                  data-chat-action="send"
                  data-testid="send-button"
                  className="pointer-events-auto flex h-12 min-w-12 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-300 sm:px-6"
                >
                  <span className="hidden sm:inline">
                    {isLoading ? "Sending" : "Send"}
                  </span>
                  <svg
                    className="pointer-events-none h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="m3 3 14 7-14 7 2-7-2-7Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>

              <p className="mt-3 text-center text-xs text-slate-400">
                Press Enter to send <span aria-hidden="true">{"\u00b7"}</span>{" "}
                Shift + Enter for a new line
              </p>
            </div>
          </section>

          <aside className="pointer-events-auto relative z-10 space-y-5">
            <section className="pointer-events-auto rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-200/50">
              <h2 className="font-semibold">Popular questions</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Choose one to start a conversation.
              </p>
              <div className="mt-4 space-y-2">
                {exampleQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={isLoading}
                    onClick={(event) => handleExampleClick(event, question)}
                    data-chat-action="example"
                    data-question={question}
                    data-testid="example-question"
                    className="group pointer-events-auto flex min-h-11 w-full touch-manipulation items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-medium leading-5 text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {question}
                    <span className="pointer-events-none text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600">
                      {"\u2192"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="pointer-events-auto rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
              <div className="flex gap-3">
                <span className="pointer-events-none mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold">
                  i
                </span>
                <p>
                  AI assistant answers are based on the provided business
                  information.
                </p>
              </div>
            </section>
          </aside>
        </div>

        <footer className="pt-8 text-center text-xs text-slate-400">
          BrightCart <span aria-hidden="true">{"\u00b7"}</span> Eco-friendly
          choices for everyday living
        </footer>
      </div>
    </main>
  );
}
