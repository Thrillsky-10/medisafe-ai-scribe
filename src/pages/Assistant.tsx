
import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Bot,
  FileSearch,
  Mic,
  PanelRightOpen,
  Search,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  message: string;
  timestamp: Date;
}

const Assistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      message:
        "Hello, I'm your MediSafe AI assistant. I can help you retrieve patient prescription histories and answer questions about medications. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: "user" as const,
      message: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    // Simulate AI response delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Example responses based on user query
      let aiResponse = "I'm not sure how to respond to that. Could you rephrase your question?";
      
      if (inputValue.toLowerCase().includes("diabetes") || inputValue.toLowerCase().includes("medication")) {
        aiResponse = "I've found 3 patients with diabetes medications in 2024. Patient A is on Metformin 500mg twice daily, Patient B is on Glipizide 5mg daily, and Patient C is on Januvia 100mg daily. Would you like more details on any of these prescriptions?";
      } else if (inputValue.toLowerCase().includes("show") || inputValue.toLowerCase().includes("find") || inputValue.toLowerCase().includes("search")) {
        aiResponse = "I'll search for that information in our secure prescription database. Please note that all patient information is protected under HIPAA regulations and my responses automatically redact sensitive personal information.";
      } else if (inputValue.toLowerCase().includes("hello") || inputValue.toLowerCase().includes("hi")) {
        aiResponse = "Hello! I'm your MediSafe AI assistant. I can help you retrieve patient prescription histories, analyze medication patterns, or answer questions about prescriptions and treatments. How can I help you today?";
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai" as const,
        message: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast.error("Error communicating with the AI assistant");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>

        <div className="flex flex-1 gap-6 h-full">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <Card className="flex flex-col h-[calc(100vh-220px)]">
              <CardContent className="flex flex-col flex-1 p-0">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start max-w-[80%] ${
                          msg.type === "user"
                            ? "chat-message-user"
                            : "chat-message-ai"
                        }`}
                      >
                        {msg.type === "ai" && (
                          <Bot className="h-5 w-5 mr-2 shrink-0 mt-1" />
                        )}
                        <div>
                          <div className="text-sm">{msg.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        {msg.type === "user" && (
                          <User className="h-5 w-5 ml-2 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="chat-message-ai">
                        <Bot className="h-5 w-5 mr-2" />
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="icon"
                      variant="outline"
                      type="button"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <div className="relative flex-1">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about patient prescriptions..."
                        className="pr-10"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-0 top-0 h-full"
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isProcessing}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      type="button"
                      onClick={() => setShowInfo(!showInfo)}
                    >
                      <PanelRightOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Information Panel */}
          {showInfo && (
            <div className="w-80">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Sample Questions</h3>
                  <div className="space-y-2">
                    <div
                      className="text-sm cursor-pointer hover:bg-accent/50 p-2 rounded flex items-center"
                      onClick={() => setInputValue("Show diabetes medications for Patient X in 2024")}
                    >
                      <Search className="h-4 w-4 mr-2 text-primary" />
                      Show diabetes medications for Patient X in 2024
                    </div>
                    <div
                      className="text-sm cursor-pointer hover:bg-accent/50 p-2 rounded flex items-center"
                      onClick={() => setInputValue("Find potential drug interactions for Patient Y")}
                    >
                      <FileSearch className="h-4 w-4 mr-2 text-primary" />
                      Find potential drug interactions for Patient Y
                    </div>
                    <div
                      className="text-sm cursor-pointer hover:bg-accent/50 p-2 rounded flex items-center"
                      onClick={() => setInputValue("Compare current prescription with previous one")}
                    >
                      <Search className="h-4 w-4 mr-2 text-primary" />
                      Compare current prescription with previous one
                    </div>
                  </div>

                  <h3 className="font-semibold mt-4 mb-2">AI Capabilities</h3>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span>Natural language prescription queries</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span>Semantic search across patient records</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span>Medication history analysis</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span>Drug interaction warnings</span>
                    </li>
                  </ul>

                  <h3 className="font-semibold mt-4 mb-2">Privacy Note</h3>
                  <p className="text-xs text-muted-foreground">
                    All conversations are encrypted and comply with HIPAA regulations. 
                    Personal identifiable information is automatically detected and redacted 
                    in responses to maintain patient confidentiality.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Assistant;
