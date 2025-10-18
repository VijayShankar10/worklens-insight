import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Upload, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Domain {
  id: string;
  domain: string;
  category: string;
}

interface ProductivityRule {
  id: string;
  domain_pattern: string;
  keywords: any;
  category: "productive" | "unproductive" | "neutral";
  priority: number;
}

const Settings = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [rules, setRules] = useState<ProductivityRule[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newCategory, setNewCategory] = useState<"productive" | "unproductive" | "neutral">("neutral");
  const [newRule, setNewRule] = useState<{
    domain_pattern: string;
    keywords: string;
    category: "productive" | "unproductive" | "neutral";
    priority: number;
  }>({
    domain_pattern: "",
    keywords: "",
    category: "neutral",
    priority: 0,
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }
    fetchSettings();
  }, [navigate]);

  const fetchSettings = async () => {
    const { data: domainsData } = await supabase.from("domains").select("*").order("domain");
    const { data: rulesData } = await supabase.from("productivity_rules").select("*").order("priority", { ascending: false });

    if (domainsData) setDomains(domainsData);
    if (rulesData) setRules(rulesData);
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    const { error } = await supabase.from("domains").insert([{ domain: newDomain.trim(), category: newCategory }]);

    if (error) {
      toast.error("Failed to add domain");
    } else {
      toast.success("Domain added successfully!");
      setNewDomain("");
      fetchSettings();
    }
  };

  const handleUpdateDomainCategory = async (id: string, category: "productive" | "unproductive" | "neutral") => {
    const { error } = await supabase.from("domains").update({ category }).eq("id", id);

    if (error) {
      toast.error("Failed to update domain");
    } else {
      toast.success("Domain updated!");
      fetchSettings();
    }
  };

  const handleAddRule = async () => {
    if (!newRule.domain_pattern.trim()) {
      toast.error("Please enter a domain pattern");
      return;
    }

    const keywordsArray = newRule.keywords.split(",").map((k) => k.trim()).filter(Boolean);

    const { error } = await supabase.from("productivity_rules").insert([
      {
        domain_pattern: newRule.domain_pattern,
        keywords: keywordsArray,
        category: newRule.category,
        priority: newRule.priority,
      },
    ]);

    if (error) {
      toast.error("Failed to add rule");
    } else {
      toast.success("Rule added successfully!");
      setNewRule({ domain_pattern: "", keywords: "", category: "neutral", priority: 0 });
      fetchSettings();
    }
  };

  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").slice(1); // Skip header
      const domainsToImport = lines
        .map((line) => {
          const [domain, category] = line.split(",").map((s) => s.trim());
          if (domain && category && (category === "productive" || category === "unproductive" || category === "neutral")) {
            return { domain, category: category as "productive" | "unproductive" | "neutral" };
          }
          return null;
        })
        .filter((item): item is { domain: string; category: "productive" | "unproductive" | "neutral" } => item !== null);

      const { error } = await supabase.from("domains").insert(domainsToImport);

      if (error) {
        toast.error("Failed to import domains");
      } else {
        toast.success(`Imported ${domainsToImport.length} domains!`);
        fetchSettings();
      }
    };
    reader.readAsText(file);
  };

  const filteredDomains = domains.filter((d) => d.domain.toLowerCase().includes(searchQuery.toLowerCase()));

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "productive":
        return "default";
      case "unproductive":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar />
      <div className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your WorkLens configuration</p>
        </div>

        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="domains">Domain Classification</TabsTrigger>
            <TabsTrigger value="rules">Productivity Rules</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                      <SettingsIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Domain Management</CardTitle>
                      <CardDescription>Classify domains as productive, unproductive, or neutral</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <Button variant="outline" className="gap-2" asChild>
                        <span>
                          <Upload className="w-4 h-4" />
                          Import CSV
                        </span>
                      </Button>
                    </Label>
                    <Input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleBulkImport} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter domain (e.g., github.com)"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                    />
                  </div>
                  <Select value={newCategory} onValueChange={(val: "productive" | "unproductive" | "neutral") => setNewCategory(val)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="productive">Productive</SelectItem>
                      <SelectItem value="unproductive">Unproductive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddDomain} className="gradient-primary text-white">
                    Add Domain
                  </Button>
                </div>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search domains..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold">Domain</th>
                        <th className="text-left p-4 font-semibold">Category</th>
                        <th className="text-left p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDomains.map((domain) => (
                        <tr key={domain.id} className="border-t hover:bg-muted/30">
                          <td className="p-4 font-medium">{domain.domain}</td>
                          <td className="p-4">
                            <Badge variant={getCategoryBadgeVariant(domain.category)}>{domain.category}</Badge>
                          </td>
                          <td className="p-4">
                            <Select
                              value={domain.category}
                              onValueChange={(val) => handleUpdateDomainCategory(domain.id, val as "productive" | "unproductive" | "neutral")}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="productive">Productive</SelectItem>
                                <SelectItem value="unproductive">Unproductive</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Custom Productivity Rules</CardTitle>
                <CardDescription>Create rules based on domain patterns and keywords</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 p-4 border rounded-lg bg-muted/20">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Domain Pattern (use * for wildcards)</Label>
                      <Input
                        placeholder="e.g., *.github.com"
                        value={newRule.domain_pattern}
                        onChange={(e) => setNewRule({ ...newRule, domain_pattern: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Keywords (comma-separated)</Label>
                      <Input
                        placeholder="e.g., code, programming, tutorial"
                        value={newRule.keywords}
                        onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select value={newRule.category} onValueChange={(val: "productive" | "unproductive" | "neutral") => setNewRule({ ...newRule, category: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="productive">Productive</SelectItem>
                          <SelectItem value="unproductive">Unproductive</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority (higher = more important)</Label>
                      <Input
                        type="number"
                        value={newRule.priority}
                        onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddRule} className="gradient-primary text-white w-full">
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-3">
                  {rules.map((rule) => (
                    <Card key={rule.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{rule.domain_pattern}</span>
                              <Badge variant={getCategoryBadgeVariant(rule.category)}>{rule.category}</Badge>
                              <Badge variant="outline">Priority: {rule.priority}</Badge>
                            </div>
                            {rule.keywords && Array.isArray(rule.keywords) && rule.keywords.length > 0 && (
                              <p className="text-sm text-muted-foreground">Keywords: {(rule.keywords as string[]).join(", ")}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">General Settings</CardTitle>
                <CardDescription>Configure system-wide preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Tracking Interval (seconds)</Label>
                    <Input type="number" defaultValue={60} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">How often activity data is captured</p>
                  </div>
                  <div>
                    <Label>Default Activity Category</Label>
                    <Select defaultValue="neutral">
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="productive">Productive</SelectItem>
                        <SelectItem value="unproductive">Unproductive</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Category for unclassified activities</p>
                  </div>
                  <div>
                    <Label>Report Retention (days)</Label>
                    <Input type="number" defaultValue={90} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">How long to keep activity reports</p>
                  </div>
                </div>
                <Button className="gradient-success text-white">Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
