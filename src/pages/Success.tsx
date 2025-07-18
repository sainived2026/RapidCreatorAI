
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'cancelled'>('success');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const paymentParam = searchParams.get('payment');
      const sessionId = searchParams.get('session_id');
      
      if (paymentParam === 'cancelled') {
        setPaymentStatus('cancelled');
        setLoading(false);
        return;
      }
      
      if (paymentParam === 'success' || sessionId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Update user to pro plan
            const { error } = await supabase
              .from('profiles')
              .update({ 
                plan: 'pro',
                daily_generations_limit: 10,
                daily_generations_used: 0
              })
              .eq('user_id', user.id);

            if (error) {
              console.error('Error updating profile:', error);
              setPaymentStatus('failed');
            } else {
              setPaymentStatus('success');
              toast({
                title: "🎉 You're now Pro!",
                description: "Enjoy 10 daily generations and regenerations.",
              });
            }
          } else {
            setPaymentStatus('failed');
          }
        } catch (error) {
          console.error('Error processing payment:', error);
          setPaymentStatus('failed');
        }
      } else {
        setPaymentStatus('failed');
      }
      
      setLoading(false);
    };

    checkPaymentStatus();
  }, [searchParams, toast]);

  const getStatusContent = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />,
          title: "Payment Successful!",
          description: "You're now Pro! Enjoy 10 daily generations and regenerations.",
          buttonText: "Go to Dashboard",
          buttonAction: () => navigate('/dashboard')
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />,
          title: "Payment Cancelled",
          description: "Your payment was cancelled. No charges were made.",
          buttonText: "Try Again",
          buttonAction: () => navigate('/plans')
        };
      case 'failed':
        return {
          icon: <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />,
          title: "Payment Failed",
          description: "Sorry, payment did not complete successfully. Please try again.",
          buttonText: "Try Again",
          buttonAction: () => navigate('/plans')
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Processing your payment...</p>
        </div>
      </div>
    );
  }

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {content.icon}
          <CardTitle className="text-2xl">{content.title}</CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={content.buttonAction}
            className="w-full"
            variant={paymentStatus === 'success' ? 'hero' : 'outline'}
          >
            {content.buttonText}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="w-full"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Success;
