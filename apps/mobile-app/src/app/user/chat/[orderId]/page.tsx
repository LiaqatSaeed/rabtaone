"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card, CardBody, CardHeader } from "@rabtaone/ui";

export default function ChatPage() {
  const { orderId } = useParams();
  const [messages, setMessages] = useState<{ id: number; from: "me" | "merchant"; text: string }[]>([
    { id: 1, from: "merchant", text: "Hi! We received your order." },
  ]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), from: "me", text }]);
    setText("");
  };

  return (
    <div className="p-5 space-y-5">
      <Card>
        <CardHeader title={`Chat for Order ${orderId}`} subtitle="Messages auto-delete in 24 hours" />
        <CardBody>
          <div className="space-y-3 max-h-[55vh] overflow-y-auto">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-2xl px-3 py-2 text-sm ${
                    m.from === "me" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
          <div className="mt-3">
            <input type="file" accept="image/*" className="text-sm" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
