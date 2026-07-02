import { CalendarDays, ChevronRight, DollarSign, HeartPulse, Home, ListChecks, NotebookTabs, Settings, ShoppingCart, Sparkles, Users, Utensils, Waves } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { SectionHeader } from "../../components/ui/section-header";
import { S } from "../../theme";

const platformGroups = [
  {
    title: "Household",
    items: [
      { id: "settings", label: "Household", detail: "Members, invites, defaults, and active household.", icon: Users, badge: "Core", enabled: true },
    ],
  },
  {
    title: "Home",
    items: [
      { id: "pool", label: "Pool", detail: "Existing pool care workspace.", icon: Waves, badge: "Existing", enabled: true },
      { label: "Maintenance", detail: "Future home maintenance workspace.", icon: Home, badge: "Future", enabled: false },
      { label: "Smart Home", detail: "Future integrations area.", icon: Sparkles, badge: "Future", enabled: false },
    ],
  },
  {
    title: "Health",
    items: [
      { label: "Health", detail: "Future household health tracking.", icon: HeartPulse, badge: "Future", enabled: false },
    ],
  },
  {
    title: "Finance",
    items: [
      { id: "finance", label: "Finance", detail: "Existing snapshot surface.", icon: DollarSign, badge: "Existing", enabled: true },
    ],
  },
  {
    title: "Planning",
    items: [
      { id: "college", label: "College", detail: "Existing college planning workspace.", icon: NotebookTabs, badge: "Existing", enabled: true },
      { label: "Shopping", detail: "Future shopping workspace.", icon: ShoppingCart, badge: "Future", enabled: false },
      { id: "life-lists", label: "Life Lists", detail: "Flexible lists for ideas, media, places, gifts, and family plans.", icon: ListChecks, badge: "New", enabled: true },
      { label: "Meal Planning", detail: "Future meal planning workspace.", icon: Utensils, badge: "Future", enabled: false },
    ],
  },
  {
    title: "Settings",
    items: [
      { id: "settings", label: "Settings", detail: "Profile, integrations, and app setup.", icon: Settings, badge: "Core", enabled: true },
    ],
  },
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

      {platformGroups.map(group => (
        <section key={group.title}>
          <SectionHeader title={group.title} tone={group.title === "Settings" ? "neutral" : "blue"} />
          <div className="space-y-2">
            {group.items.map(item => {
              const Icon = item.icon;
              const content = (
                <Card className={item.enabled ? "transition-colors hover:bg-accent" : "opacity-80"}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className={`h-5 w-5 shrink-0 ${item.enabled ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={`font-bold ${item.enabled ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</div>
                        <Badge variant={item.enabled ? "blue" : "slate"}>{item.badge}</Badge>
                      </div>
                      <div className="mt-1 text-sm leading-5 text-muted-foreground">{item.detail}</div>
                    </div>
                    {item.enabled && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                  </CardContent>
                </Card>
              );
              return item.enabled ? (
                <button key={`${group.title}-${item.label}`} type="button" onClick={() => onNavigate(item.id)} className="block w-full text-left">
                  {content}
                </button>
              ) : (
                <div key={`${group.title}-${item.label}`}>{content}</div>
              );
            })}
          </div>
        </section>
      ))}

      <Card>
        <EmptyStatePanel
          icon={<CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
          title="More is growing carefully"
          detail="Shopping, Meal Planning, Smart Home, and other larger areas will be added after the core household tools feel solid."
          className="py-7"
        />
      </Card>
    </div>
  );
}
