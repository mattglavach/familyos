export const BUILT_IN_TEMPLATES = [
  ["morning-routine","Morning routine","Start the day calmly",20,"daily",["Get ready","Review today’s schedule","Pack essentials"]],
  ["evening-reset","Evening reset","Close the day and prepare tomorrow",20,"daily",["Tidy shared spaces","Review tomorrow","Set out essentials"]],
  ["weekly-family-planning","Weekly family planning","Align the household for the week",30,"weekly",["Review calendar","Confirm rides and meals","Assign priority tasks"]],
  ["school-night","School-night preparation","Reduce morning friction",15,"daily",["Check assignments","Pack bags","Choose clothes","Charge devices"]],
  ["weekend-reset","Weekend reset","Reset the home for the coming week",45,"weekly",["Clear common areas","Restock essentials","Review maintenance"]],
  ["home-departure","Home departure checklist","Leave the house secure",10,"once",["Lock doors and windows","Adjust thermostat","Check pets","Take keys and documents"]],
  ["travel-preparation","Travel preparation","Prepare for an organized trip",45,"once",["Confirm itinerary","Pack medications","Arrange home coverage","Download travel documents"]],
  ["pool-party","Pool-party preparation","Prepare the pool and guest area",40,"once",["Test water","Clear deck","Set out towels","Confirm safety equipment"]],
].map(([template_key,title,description,estimated_minutes,recurrence,steps])=>({template_key,title,description,estimated_minutes,recurrence,steps,built_in:true}));
export function templateToRoutine(template){return {name:template.title,description:template.description,estimated_minutes:template.estimated_minutes,recurrence:template.recurrence,visibility:"household",archived:false,template_key:template.template_key};}
export function canDeleteTemplate(template){return !template.built_in;}
