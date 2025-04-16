
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User } from "lucide-react";
import { pipeline } from "@huggingface/transformers";

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Knowledge base for RAG system
const knowledgeBase = [
  "PrescriptiBot is an AI-powered prescription management system.",
  "Prescriptions can be uploaded through the system's upload feature.",
  "The system can extract medication information from prescription images.",
  "Medical documents are encrypted and stored in compliance with HIPAA regulations.",
  "Patients can track their medication history in the dashboard.",
  "For specific medical advice, patients should consult their healthcare provider.",
  "Refills can be requested through the system or by contacting healthcare providers.",
  "Side effects information should be obtained from doctors or pharmacists.",
  "The AI assistant can help with managing prescription records.",
  "The system supports various document types including prescriptions, lab results, and medical records."
];

export const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: 'Hello! I am PrescriptiBot, your medication assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  // Initialize the model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        // Use a simpler embedding model for performance
        const extractor = await pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2",
          { quantized: true }
        );
        setModel(extractor);
      } catch (error) {
        console.error("Error loading model:", error);
      } finally {
        setIsModelLoading(false);
      }
    };
    
    loadModel();
  }, []);
  
  // Simple RAG function to find the most relevant knowledge
  const findRelevantKnowledge = async (query: string): Promise<string> => {
    if (!model) return "I'm still loading my knowledge. Please ask again in a moment.";
    
    try {
      // Get embedding for the query
      const queryEmbedding = await model(query, { pooling: "mean", normalize: true });
      
      // Get embeddings for knowledge base items
      const knowledgeEmbeddings = await Promise.all(
        knowledgeBase.map(async (item) => {
          const embedding = await model(item, { pooling: "mean", normalize: true });
          return { item, embedding };
        })
      );
      
      // Calculate similarity scores (dot product for cosine similarity of normalized vectors)
      let bestScore = -Infinity;
      let mostRelevantKnowledge = "";
      
      for (const { item, embedding } of knowledgeEmbeddings) {
        // Compute dot product as similarity score
        const score = embedding.data.reduce((sum: number, val: number, i: number) => {
          return sum + val * queryEmbedding.data[i];
        }, 0);
        
        if (score > bestScore) {
          bestScore = score;
          mostRelevantKnowledge = item;
        }
      }
      
      return bestScore > 0.5 ? mostRelevantKnowledge : 
        "I don't have specific information about that. For detailed medical advice, please consult your healthcare provider.";
      
    } catch (error) {
      console.error("RAG error:", error);
      return "I'm having trouble processing your question. Please try again or ask something else.";
    }
  };
  
  const generateResponse = async (userMessage: string): Promise<string> => {
    if (isModelLoading) {
      return "I'm still initializing. Please give me a moment...";
    }
    
    try {
      // Try to use RAG to find relevant information
      const relevantInfo = await findRelevantKnowledge(userMessage);
      
      // Generate response based on the query and relevant information
      if (userMessage.toLowerCase().includes('side effect')) {
        return "For information about side effects, please consult with your doctor or pharmacist. They can provide detailed information based on your medical history.";
      } 
      else if (userMessage.toLowerCase().includes('prescription') || userMessage.toLowerCase().includes('refill')) {
        return "Your prescription details are available in the dashboard. You can request refills through the system or by contacting your healthcare provider.";
      }
      else if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('how')) {
        return "PrescriptiBot can help you manage prescriptions, upload medical documents, and keep track of your medications. Use the upload feature to add new prescriptions.";
      }
      
      // Fall back to the RAG response
      return relevantInfo;
    } catch (error) {
      console.error("Error generating response:", error);
      return "I apologize, but I encountered an error processing your request. Please try again.";
    }
  };
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Generate response
      const botResponse = await generateResponse(input);
      
      const botMessage: ChatMessage = {
        role: 'bot',
        content: botResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage: ChatMessage = {
        role: 'bot',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          PrescriptiBot Assistant
          {isModelLoading && <span className="text-xs text-muted-foreground">(Loading AI...)</span>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[370px] px-4">
          <div className="space-y-4 pt-4 pb-5">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'flex-row-reverse'
                      : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-primary/10'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-primary" />
                    ) : (
                      <Bot className="h-4 w-4 text-accent-foreground" />
                    )}
                  </div>
                  
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="border-t p-3">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder={isModelLoading ? "AI model is loading..." : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isModelLoading}
            className="flex-1"
          />
          <Button 
            size="icon" 
            onClick={handleSend} 
            disabled={isLoading || isModelLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
