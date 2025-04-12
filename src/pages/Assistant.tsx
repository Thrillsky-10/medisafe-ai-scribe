
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Info, Mic, Loader2, Bot } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello, I'm your medical assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // This is where you'll integrate your custom API
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // Clear input
    setInput("");
    setIsLoading(true);

    try {
      // This is a placeholder for your custom API integration
      // TODO: Replace with actual API call to your service
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "This is a placeholder response. Connect your custom AI API here.",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
      
      // The actual API integration would look something like this:
      /*
      const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          history: messages.map(m => ({
            content: m.content,
            role: m.role
          }))
        }),
      });
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      */
      
    } catch (error) {
      console.error('Error in AI API call:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main chat interface */}
          <div className="md:col-span-2 flex flex-col h-[calc(100vh-240px)]">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Bot className="mr-2 h-5 w-5 text-primary" />
                  Medical Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted rounded-tl-none"
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs text-muted-foreground mt-1 opacity-70">
                          {formatDate(message.timestamp.toISOString())}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-muted rounded-tl-none">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask about medications, patient history, dosages..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <Button 
                    size="icon" 
                    disabled={isLoading || !input.trim()}
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar with information */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Assistant Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Medical History</p>
                    <p className="text-muted-foreground">
                      Query patient medication history and treatment records
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Medication Analysis</p>
                    <p className="text-muted-foreground">
                      Identify potential drug interactions and side effects
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Clinical Guidelines</p>
                    <p className="text-muted-foreground">
                      Access evidence-based treatment recommendations
                    </p>
                  </div>
                </div>
              </CardContent>
              
              <CardContent className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2">Sample queries:</p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-xs h-auto py-1.5"
                    onClick={() => setInput("List all diabetes medications prescribed in 2024")}
                  >
                    List all diabetes medications prescribed in 2024
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-xs h-auto py-1.5"
                    onClick={() => setInput("Show possible interactions between Lisinopril and Metformin")}
                  >
                    Show possible interactions between Lisinopril and Metformin
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-xs h-auto py-1.5"
                    onClick={() => setInput("Summarize treatment history for patient Sarah Johnson")}
                  >
                    Summarize treatment history for patient Sarah Johnson
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4 bg-muted/30">
              <CardContent className="pt-4">
                <p className="text-xs">
                  <span className="font-medium">Note:</span> This assistant is HIPAA-compliant and uses RAG technology to access only authorized patient data. All interactions are logged for compliance purposes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Assistant;
