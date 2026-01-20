import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Crosshair, Eye, EyeOff, Bomb, Shield } from "lucide-react";

export default function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login submitted");
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signup logic here
    console.log("Signup submitted");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#2d3436] p-4 relative overflow-hidden" style={{ fontFamily: "'Bangers', cursive" }}>
      {/* Diagonal stripes background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, #4a5f3a 0px, #4a5f3a 40px, #3d4f2f 40px, #3d4f2f 80px)',
      }}></div>

      {/* Explosion/bomb decorations */}
      <div className="absolute top-10 left-10">
        <Bomb className="w-16 h-16 text-[#ff6b35] opacity-30 animate-pulse" />
      </div>
      <div className="absolute bottom-10 right-10">
        <Bomb className="w-20 h-20 text-[#ff6b35] opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      <div className="absolute top-1/3 right-20">
        <Shield className="w-12 h-12 text-[#4a5f3a] opacity-40" />
      </div>
      <div className="absolute bottom-1/3 left-20">
        <Shield className="w-14 h-14 text-[#4a5f3a] opacity-30" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-[#F0EAD6] border-4 border-[#2d3436] shadow-[8px_8px_0px_rgba(0,0,0,0.3)] transform rotate-[-0.5deg]">
        <CardHeader className="space-y-4 pb-6 bg-[#4a5f3a] border-b-4 border-[#2d3436] relative">
          {/* Camouflage pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, transparent 20%, #2d3436 21%, #2d3436 34%, transparent 35%), radial-gradient(circle at 60% 30%, transparent 20%, #2d3436 21%, #2d3436 34%, transparent 35%)',
            backgroundSize: '80px 80px'
          }}></div>
          
          <div className="flex items-center justify-center mb-2 relative z-10">
            <div className="p-4 bg-[#ff6b35] border-4 border-[#2d3436] rounded-full shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
              <Crosshair className="w-10 h-10 text-[#F0EAD6]" strokeWidth={3} />
            </div>
          </div>
          <div className="text-center space-y-2 relative z-10">
            <CardTitle className="text-3xl text-[#F0EAD6] tracking-wide" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.3)' }}>
              WAR ZONE!
            </CardTitle>
            <CardDescription className="text-lg text-[#F0EAD6]/90">
              JOIN THE BATTLE!
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#4a5f3a] border-4 border-[#2d3436] p-1 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-[#F0EAD6] text-lg border-2 border-transparent data-[state=active]:border-[#2d3436] data-[state=active]:shadow-[2px_2px_0px_rgba(0,0,0,0.3)] text-[#F0EAD6] transform data-[state=active]:scale-105 transition-transform"
              >
                ENLIST
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-[#F0EAD6] text-lg border-2 border-transparent data-[state=active]:border-[#2d3436] data-[state=active]:shadow-[2px_2px_0px_rgba(0,0,0,0.3)] text-[#F0EAD6] transform data-[state=active]:scale-105 transition-transform"
              >
                RECRUIT
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-xl text-[#2d3436]">SOLDIER NAME:</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter callsign"
                    className="bg-white border-3 border-[#2d3436] text-[#2d3436] text-lg placeholder:text-[#2d3436]/40 focus:border-[#4a5f3a] focus:ring-4 focus:ring-[#4a5f3a]/30 h-12 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-xl text-[#2d3436]">SECRET CODE:</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Top secret"
                      className="bg-white border-3 border-[#2d3436] text-[#2d3436] text-lg placeholder:text-[#2d3436]/40 focus:border-[#4a5f3a] focus:ring-4 focus:ring-[#4a5f3a]/30 pr-10 h-12 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2d3436] hover:text-[#4a5f3a]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button type="button" className="text-base text-[#ff6b35] hover:text-[#ff6b35]/80 hover:underline">
                    Forgot code?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-[#F0EAD6] text-2xl border-4 border-[#2d3436] shadow-[5px_5px_0px_rgba(0,0,0,0.3)] hover:shadow-[7px_7px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all h-14 tracking-wider"
                >
                  ⚔️ DEPLOY! ⚔️
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-username" className="text-xl text-[#2d3436]">SOLDIER NAME:</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="Choose callsign"
                    className="bg-white border-3 border-[#2d3436] text-[#2d3436] text-lg placeholder:text-[#2d3436]/40 focus:border-[#4a5f3a] focus:ring-4 focus:ring-[#4a5f3a]/30 h-12 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-xl text-[#2d3436]">RADIO CONTACT:</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="soldier@warzone.com"
                    className="bg-white border-3 border-[#2d3436] text-[#2d3436] text-lg placeholder:text-[#2d3436]/40 focus:border-[#4a5f3a] focus:ring-4 focus:ring-[#4a5f3a]/30 h-12 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-xl text-[#2d3436]">SECRET CODE:</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create code"
                      className="bg-white border-3 border-[#2d3436] text-[#2d3436] text-lg placeholder:text-[#2d3436]/40 focus:border-[#4a5f3a] focus:ring-4 focus:ring-[#4a5f3a]/30 pr-10 h-12 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2d3436] hover:text-[#4a5f3a]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-xl text-[#2d3436]">CONFIRM CODE:</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat code"
                      className="bg-white border-3 border-[#2d3436] text-[#2d3436] text-lg placeholder:text-[#2d3436]/40 focus:border-[#4a5f3a] focus:ring-4 focus:ring-[#4a5f3a]/30 pr-10 h-12 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2d3436] hover:text-[#4a5f3a]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-[#F0EAD6] text-2xl border-4 border-[#2d3436] shadow-[5px_5px_0px_rgba(0,0,0,0.3)] hover:shadow-[7px_7px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all h-14 tracking-wider"
                >
                  💣 JOIN ARMY! 💣
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-[#2d3436]/70">
            By enlisting you agree to our{" "}
            <button className="text-[#ff6b35] hover:text-[#ff6b35]/80 hover:underline">Rules of War</button>
            {" "}and{" "}
            <button className="text-[#ff6b35] hover:text-[#ff6b35]/80 hover:underline">Battle Code</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}