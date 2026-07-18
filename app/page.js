"use client";

import { useEffect, useRef, useState } from "react";

const exampleQuestions = [
  "What products do you sell?",
  "What is your return policy?",
  "How long does shipping take?",
  "What payment methods do you accept?",
  "Can I cancel my order?",
];

const MAX_MESSAGE_LENGTH = 500;
const GENERIC_CHAT_ERROR =
  "Sorry, I couldn’t process your request right now. Please try again in a moment.";

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

function SendIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
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
  );
}

function SparkIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 2.5 11.85 7 16.5 8.85 11.85 10.7 10 15.5 8.15 10.7 3.5 8.85 8.15 7 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m15.5 13 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"
        stroke="currentColor"
        strokeWidth="1.3"
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

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] text-left sm:max-w-[76%]">
        <p className="mb-1 px-1 text-xs font-semibold text-slate-500">
          BrightCart AI
        </p>
        <div
          role="status"
          aria-live="polite"
          aria-label="BrightCart AI is typing."
          className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"
        >
          <span className="sr-only">BrightCart AI is typing.</span>
          <span
            className="flex items-center gap-1.5"
            aria-hidden="true"
          >
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState([]);
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

    if (isLoadingRef.current) return;

    if (!trimmedMessage) {
      setError("Please enter a question before sending.");
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(
        `Please keep your question under ${MAX_MESSAGE_LENGTH} characters.`,
      );
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", content: trimmedMessage },
    ]);
    setInput("");
    setError("");
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage }),
      });
      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(GENERIC_CHAT_ERROR);
      }

      if (!response.ok) {
        throw new Error(GENERIC_CHAT_ERROR);
      }

      const reply = typeof data.reply === "string" ? data.reply.trim() : "";

      if (!reply) {
        throw new Error(GENERIC_CHAT_ERROR);
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch (requestError) {
      const errorMessage =
        requestError?.name === "AbortError"
          ? "Sorry, the request was interrupted. Please try again in a moment."
          : GENERIC_CHAT_ERROR;

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: errorMessage,
          isError: true,
          retryMessage: trimmedMessage,
        },
      ]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }

  async function retryMessage(messageText, failedMessageIndex) {
    if (isLoadingRef.current) return;

    setMessages((current) =>
      current.filter((_, index) => index !== failedMessageIndex),
    );
    setError("");
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });
      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(GENERIC_CHAT_ERROR);
      }

      if (!response.ok) {
        throw new Error(GENERIC_CHAT_ERROR);
      }

      const reply = typeof data.reply === "string" ? data.reply.trim() : "";

      if (!reply) {
        throw new Error(GENERIC_CHAT_ERROR);
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch (requestError) {
      const errorMessage =
        requestError?.name === "AbortError"
          ? "Sorry, the request was interrupted. Please try again in a moment."
          : GENERIC_CHAT_ERROR;

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: errorMessage,
          isError: true,
          retryMessage: messageText,
        },
      ]);
    } finally {
      isLoadingRef.current = false;
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

  function handleClearChat() {
    setMessages([]);
    setInput("");
    setError("");
    lastNativeActionRef.current = { key: "", time: 0 };
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
    <main className="relative min-h-screen overflow-x-hidden bg-[#f5f7fb] px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_32rem),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(245,247,251,0))]" />

      <div className="pointer-events-auto relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col sm:min-h-[calc(100vh-4rem)]">
        <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <SupportIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                BrightCart AI
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600">
                24/7 Customer Support Assistant
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Active now
            </div>
            <button
              type="button"
              onClick={handleClearChat}
              disabled={isLoading || (!messages.length && !input && !error)}
              className="min-h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start new conversation
            </button>
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/70">
          <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <SupportIcon />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-950">
                    BrightCart AI Support
                  </h2>
                  <p className="text-xs text-slate-500">
                    Answers grounded in BrightCart support information
                  </p>
                </div>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                Products, shipping, returns, payments
              </div>
            </div>
          </div>

          <div
            className="min-h-[420px] flex-1 overflow-y-auto bg-slate-50/80 p-4 sm:min-h-[520px] sm:p-6"
            role="log"
            aria-label="Conversation messages"
            aria-live="polite"
            aria-relevant="additions text"
          >
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.length === 0 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <SparkIcon />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        Welcome to BrightCart AI
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Ask about BrightCart products, shipping timelines,
                        returns, payment options, order changes, and store
                        policies. The assistant answers using BrightCart&apos;s
                        available support information.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {exampleQuestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        disabled={isLoading}
                        onClick={(event) => handleExampleClick(event, question)}
                        data-chat-action="example"
                        data-question={question}
                        data-testid="example-question"
                        className="group flex min-h-12 touch-manipulation items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-sm font-semibold leading-5 text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span>{question}</span>
                        <span
                          className="pointer-events-none text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
                          aria-hidden="true"
                        >
                          {"\u2192"}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <div className="space-y-5">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[76%] ${
                        message.role === "user"
                          ? "order-2 text-right"
                          : "order-1 text-left"
                      }`}
                    >
                      <p
                        className={`mb-1 px-1 text-xs font-semibold ${
                          message.role === "user"
                            ? "text-emerald-700"
                            : message.isError
                              ? "text-amber-700"
                              : "text-slate-500"
                        }`}
                      >
                        {message.role === "user" ? "You" : "BrightCart AI"}
                      </p>
                      <div
                        role={message.isError ? "alert" : undefined}
                        className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm [overflow-wrap:anywhere] ${
                          message.role === "user"
                            ? "rounded-br-md bg-emerald-600 text-left text-white"
                            : message.isError
                              ? "rounded-bl-md border border-amber-200 bg-amber-50 text-amber-900"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <MessageContent content={message.content} />
                        {message.isError && (
                          <button
                            type="button"
                            aria-label="Try sending this question again"
                            onClick={() =>
                              retryMessage(message.retryMessage, index)
                            }
                            disabled={isLoading}
                            className="mt-3 block rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Try again
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4 sm:p-5">
            {error && (
              <div
                id="message-error"
                role="alert"
                className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <label htmlFor="message" className="sr-only">
                Ask BrightCart a question
              </label>
              <textarea
                id="message"
                name="message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                aria-describedby={
                  error ? "message-error message-help" : "message-help"
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage(event.currentTarget.value);
                  }
                }}
                rows="1"
                maxLength={MAX_MESSAGE_LENGTH}
                enterKeyHint="send"
                placeholder="Ask about products, shipping, returns, or payments..."
                disabled={isLoading}
                data-testid="chat-input"
                className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={isLoading}
                data-chat-action="send"
                data-testid="send-button"
                className="flex h-12 min-w-12 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/25 disabled:cursor-not-allowed disabled:bg-slate-300 sm:min-w-28 sm:px-6"
              >
                <span className="hidden sm:inline">
                  {isLoading ? "Sending" : "Send"}
                </span>
                <SendIcon />
              </button>
            </form>

            <p
              id="message-help"
              className="mt-3 text-center text-xs text-slate-400"
            >
              Press Enter to send <span aria-hidden="true">{"\u00b7"}</span>{" "}
              Shift + Enter for a new line
            </p>
          </div>
        </section>

        <footer className="pt-8 text-center text-xs text-slate-400">
          BrightCart <span aria-hidden="true">{"\u00b7"}</span> Eco-friendly
          choices for everyday living
        </footer>
      </div>
    </main>
  );
}
