import { Bot, ChevronRight, Clock3, DollarSign, Heart, Home, ListChecks, NotebookTabs, Repeat2, Settings, Utensils, Waves } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { SectionHeader } from "../../components/ui/section-header";
import { S } from "../../theme";

const platformGroups = [
  { title: "Daily", items: [{id:"relationships",label:"Relationships",detail:"Strengthen important connections with lightweight prompts, time together, and transparent health guidance.",icon:Heart,badge:"New",enabled:true},{id:"timeline",label:"Household Timeline",detail:"Review past, current, and upcoming household activity in one place.",icon:Clock3,badge:"New",enabled:true},{id:"habits",label:"Habits",detail:"Track personal and household consistency.",icon:Repeat2,badge:"Core",enabled:true},{id:"routines",label:"Routines",detail:"Run repeatable household checklists.",icon:Repeat2,badge:"New",enabled:true}] },
  { title: "AI", items: [{id:"ai-workspace",label:"Family Assistant",detail:"Ask household questions, build a weekly plan, and review proposed actions grounded in FamilyOS data.",icon:Bot,badge:"3.2",enabled:true}] },
  {
    title: "Home",
    items: [
      { id: "pool", label: "Pool", detail: "Existing pool care workspace.", icon: Waves, badge: "Existing", enabled: true },
      { id: "home-assets", label: "Home Operations", detail: "Assets, maintenance, warranties, vehicles, lawn, garden, and projects.", icon: Home, badge: "New", enabled: true },
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
      { id: "meal-planning", label: "Meal Planning", detail: "Recipes, weekly meal plans, assignments, and pantry checks.", icon: Utensils, badge: "New", enabled: true },
      { id: "life-lists", label: "Life Lists", detail: "Flexible lists for ideas, media, places, gifts, and family plans.", icon: ListChecks, badge: "New", enabled: true },
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
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Core daily flows stay in Home, Habits, Calendar, and Tasks. Use the top Add button for global creation; Pool and lower-frequency modules live here.</p>
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

    </div>
  );
}
