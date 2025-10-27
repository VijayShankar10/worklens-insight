import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simple demo authentication
    // In production, this should call your backend API
    setTimeout(() => {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("isAuthenticated", "true");
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error("Invalid username or password");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto flex items-center justify-centern overflow-hidden">
            <img src="/logo.png" alt="WorkLens Logo" className="w-10 h-10 object-contain" />
          </div>
          <CardTitle className="text-3xl font-bold">WorkLens</CardTitle>
          <p className="text-muted-foreground">
            Employee Productivity Analytics Dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary text-white"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground font-semibold mb-2">
                Demo Credentials:
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Username: <span className="font-mono font-semibold text-foreground">admin</span>
                </p>
                <p className="text-muted-foreground">
                  Password: <span className="font-mono font-semibold text-foreground">admin123</span>
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
