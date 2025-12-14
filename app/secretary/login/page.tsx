"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { signInSecretary } from "@/lib/firebase/secretaryAuth";

export default function SecretaryLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await signInSecretary(email, password);
      console.log("Secretary logged in:", user);
      router.push("/secretary/dashboard"); // create secretary dashboard later
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/40">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl">Secretary Login</CardTitle>
          <CardDescription>
            Sign in to access the secretary dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert
              variant="destructive"
              className="mb-4 flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 mt-[2px]" />
              <div>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="secretary@SahelX.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button disabled={isLoading} className="w-full" type="submit">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            SahelX Logistics Secretary Portal
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
