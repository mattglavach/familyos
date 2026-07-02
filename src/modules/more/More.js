import { CalendarDays, ChevronRight, DollarSign, Home, ListChecks, NotebookTabs, Settings, ShoppingCart, Sparkles, Users, Utensils, Waves } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { SectionHeader } from "../../components/ui/section-header";
import { S } from "../../theme";

const activeModules = [
  { id: "settings", label: "Household & Settings", detail: "Members, invites, household defaults, profile, and integrations.", icon: Users, badge: "Core" },
  { id: "finance", label: "Finance", detail: "Existing snapshot surface. No Release 1.0 expansion.", icon: DollarSign, badge: "Existing" },
  { id: "pool", label: "Pool", detail: "Existing pool care surface. No Release 1.0 expansion.", icon: Waves, badge: "Existing" },
  { id: "college", label: "College", detail: "Existing college planning surface. No Release 1.0 expansion.", icon: NotebookTabs, badge: "Existing" },
];

const futureModules = [
  { label: "Home Maintenance", icon: Home },
  { label: "Shopping", icon: ShoppingCart },
  { label: "Life Lists", icon: ListChecks },
  { label: "Meal Planning", icon: Utensils },
  { label: "Smart Home", icon: Sparkles },
];

export function More({ onNavigate }) {
  return (
    <div style={S.screen} className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          <Settings className="h-4 w-4" aria-hidden="true" />
          More
        </div>
        <div className="mt-1 text-2xl font-extrabold text-foreground">Household Modules</div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Core daily flows stay in Home, Tasks, Calendar, and Quick Add. Lower-frequency and future modules live here.</p>
      </div>

      <section>
        <SectionHeader title="Available" tone="blue" />
        <div className="space-y-3">
          {activeModules.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => onNavigate(item.id)} className="block w-full text-left">
                <Card className="transition-colors hover:bg-accent">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-bold text-foreground">{item.label}</div>
                        <Badge variant="blue">{item.badge}</Badge>
                      </div>
                      <div className="mt-1 text-sm leading-5 text-muted-foreground">{item.detail}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader title="Future" tone="neutral" />
        <div className="grid gap-2 sm:grid-cols-2">
          {futureModules.map(item => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="opacity-80">
                <CardContent className="flex items-center gap-3 p-3">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1 text-sm font-semibold text-muted-foreground">{item.label}</div>
                  <Badge variant="slate">Future</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card>
        <EmptyStatePanel
          icon={<CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
          title="Release 1.0 stays focused"
          detail="Shopping, Life Lists, Meal Planning, Smart Home, AI, and major integrations are intentionally deferred until the core household operating loop is stable."
          className="py-7"
        />
      </Card>
    </div>
  );
}
