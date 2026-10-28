export type Kind = "post" | "craft" | "signal" | "person" | "net" | "host" | "port" | "soft" | "file";

export type GraphNode = {
  id: string;
  label: string;
  kind: Kind;
  blurb: string;
  notes: string;
  facts: readonly { k: string; v: string }[];
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export const KIND_LABEL: Record<Kind, string> = {
  post: "Posts",
  craft: "Craft",
  signal: "Signals",
  person: "People",
  net: "Networks",
  host: "Hosts",
  port: "Ports",
  soft: "Software",
  file: "Files",
};

function node(
  id: string,
  label: string,
  kind: Kind,
  blurb: string,
  notes: string,
  facts: readonly [string, string][],
): GraphNode {
  return {
    id,
    label,
    kind,
    blurb,
    notes,
    facts: facts.map(([k, v]) => ({ k, v })),
  };
}

export const NODES: readonly GraphNode[] = [
  node("vesper", "Vesper Array", "post", "Primary listening ring on the Svalbard shelf.", "Three concentric hydrophone rings sit under seasonal ice. The cleanest takes of the Kestrel Tone were cut here, between storms, when the array can hear its own clock.", [["Latitude", "79.4° N"], ["Phones", "64"], ["Since", "2014"]]),
  node("northglass", "Northglass", "post", "Northern lobe of the Vesper ring.", "A fan of phones aimed at the glacier face. Glass Knock shows up here first, a bright tick before the rest of the array agrees it happened.", [["Bearing", "012°"], ["Phones", "16"], ["Ice", "seasonal"]]),
  node("southglass", "Southglass", "post", "Southern lobe, pointed at open water.", "Less ice, more shipping noise. Rim Harmonic is clearest on this lobe, riding the boundary where shelf water meets the drift.", [["Bearing", "186°"], ["Phones", "16"], ["Traffic", "moderate"]]),
  node("lantern", "Lantern Field", "post", "A scatter of relay buoys west of the array.", "The buoys mark a patch of water that goes unnaturally quiet. Crews call the hole the Null Pocket and refuse to anchor in it overnight.", [["Buoys", "22"], ["Depth", "140 m"], ["Status", "active"]]),
  node("brine", "Camp Brine", "post", "Seasonal ice camp on the fast ice.", "A dozen tents, a winch, and a kettle that never quite boils. Brine Chorus is sampled here when the ice is thick enough to walk.", [["Season", "Feb–May"], ["Crew", "6"], ["Ice", "fast"]]),
  node("hut", "Hut Meridian", "post", "Ridge hut that gave the chart its name.", "One room, a stove, and the best view of Vesper. Visitors sign the beam. Arguments about the Tone usually start at the table.", [["Built", "1998"], ["Bunks", "4"], ["Radio", "HF"]]),
  node("halcyon", "Dock Halcyon", "post", "Supply harbor for the whole mesh.", "Everything that floats in this chart has tied up here at least once. The dockmaster’s board is more accurate than the official schedule.", [["Berths", "9"], ["Fuel", "marine diesel"], ["Ice", "kept open"]]),
  node("kite", "Relay Kite", "post", "Hilltop microwave hop above the dock.", "A shack and a dish the size of a dinner table. It carries Vesper’s takes to Halcyon when the undersea cable is sulking.", [["Link", "microwave"], ["Uptime", "98%"], ["Power", "wind"]]),
  node("salt", "Bunker Salt", "post", "Buried store for cable, fuel, and spare phones.", "Concrete, dry, and colder than the dock. Skiff Nine treats it as a second home between buoy runs.", [["Stores", "cable, phones"], ["Access", "keyed"], ["Temp", "2° C"]]),
  node("pellhouse", "Pell House", "post", "Shore archive of paper logs and tapes.", "Otto Pell will not let the originals leave the building. Red Return lives in a drawer he locks twice.", [["Holdings", "40 years"], ["Format", "tape, paper"], ["Town", "Longyearbyen"]]),
  node("winch", "Ridge Winch", "post", "Haul point above Camp Brine.", "A diesel winch bolted to rock. It lifts cores, tents, and occasionally a sulking scientist, when the ice road is the only road.", [["Lift", "1.2 t"], ["Cable", "80 m"], ["Fuel", "diesel"]]),
  node("floe", "Floe Gate", "post", "The ice edge the ships actually use.", "Not a building. A line on every watch bill: cross here, or wait. Drift Cadence is strongest just outside the gate.", [["Type", "ice edge"], ["Watch", "24 h"], ["Season", "year-round"]]),

  node("kestrel", "Icebreaker Kestrel", "craft", "The ship the Tone is named for, or the other way around.", "Painted bone above the waterline and rust below. She chases the Tone, launches Orrery, and still makes Halcyon for Sunday bread.", [["Class", "icebreaker"], ["Crew", "18"], ["Home", "Halcyon"]]),
  node("marrow", "Tender Marrow", "craft", "Workboat that keeps the skiffs honest.", "Short, stubborn, and usually towing something she was not designed to tow. If a phone is in the water, Marrow put it there or is about to pull it out.", [["Length", "18 m"], ["Role", "tender"], ["Parent", "Kestrel"]]),
  node("skiff", "Skiff Four", "craft", "Jonah Greer’s hydrophone skiff.", "An open boat with too many cables and one dry box. Four is the only skiff Greer trusts when the swell is confused.", [["Length", "6 m"], ["Gear", "drop phones"], ["Cox", "Greer"]]),
  node("orrery", "Submersible Orrery", "craft", "Deep boat for the layers under the shelf.", "A sphere, a lamp, and Ren Harrow’s handwriting on the checklist. She traced Shear Whisper along a slope nobody had charted twice.", [["Depth", "800 m"], ["Crew", "2"], ["Launch", "Kestrel"]]),
  node("bramble", "Cutter Bramble", "craft", "Escort and occasional ice taxi.", "Bosun Ett runs her like a kitchen: everything has a hook. She walks barges through the gate and shelters at Salt when the barometer drops.", [["Length", "24 m"], ["Role", "escort"], ["Cox", "Ett"]]),
  node("yarrow", "Barge Yarrow", "craft", "Fuel, food, and the mail.", "Unlovely and indispensable. Nia Solberg’s routing board lives in a plastic sleeve taped to the wheelhouse window.", [["Cargo", "fuel, stores"], ["Route", "Halcyon loop"], ["Draft", "shallow"]]),
  node("hob", "Drifter Hob", "craft", "Untethered buoy that goes where the cadence goes.", "No engine, no crew, a clock and a phone. Hob has logged Long Pulse three seasons running and has never once returned on schedule.", [["Type", "drifter"], ["Track", "passive"], ["Seasons", "3"]]),
  node("skiff9", "Skiff Nine", "craft", "Buoy tender for the Lantern Field.", "Nine services the relays and runs spares back to Bunker Salt. The crew paints a new tally mark on the thwart after every pocket crossing.", [["Length", "7 m"], ["Route", "Lantern"], ["Marks", "41"]]),

  node("calder", "Inez Calder", "person", "Acoustics lead. She named the Tone.", "Calder hears structure where other people hear weather. She staffs Vesper, mentors Greer, and still answers Harrow’s dives herself.", [["Role", "acoustics"], ["Post", "Vesper"], ["Since", "2011"]]),
  node("vale", "Soren Vale", "person", "Captain of Icebreaker Kestrel.", "Quiet on the bridge, particular about the gate. He trusts Mara Quill with the engines and does not pretend to understand the Tone.", [["Role", "captain"], ["Ship", "Kestrel"], ["Watch", "gate"]]),
  node("quill", "Mara Quill", "person", "Engineer. Keeps Vesper and Kestrel in the same key.", "Quill tuned the array’s clock to the ship’s, which is why the takes finally line up. Vale says the ship runs better when she is annoyed.", [["Role", "engineer"], ["Ships", "Kestrel"], ["Array", "clock"]]),
  node("harrow", "Ren Harrow", "person", "Pilot of Submersible Orrery.", "Harrow writes everything down twice and reports to Calder before the hatch is dry. The slope under Shear Whisper is sketched in the margin of a dive log.", [["Role", "pilot"], ["Boat", "Orrery"], ["Dives", "120"]]),
  node("pell", "Otto Pell", "person", "Archivist. Disputes the Null Pocket.", "Pell keeps Hut Meridian and the shore archive. He has a tape of Red Return he will play for you once, and a theory about the Pocket he will not drop.", [["Role", "archivist"], ["House", "Pell House"], ["Since", "1986"]]),
  node("voss", "Laila Voss", "person", "Ice radar, wintering at Camp Brine.", "Voss walks the same line of flags every morning and caught Ice Tick on a recorder she was not supposed to leave running.", [["Role", "ice radar"], ["Camp", "Brine"], ["Season", "winter"]]),
  node("greer", "Jonah Greer", "person", "Hydrophones. Lives on Skiff Four.", "Greer drops phones the way other people set a table. Calder trained him. He confirmed Glass Knock by ear before the plot agreed.", [["Role", "phones"], ["Boat", "Skiff Four"], ["Mentor", "Calder"]]),
  node("solberg", "Nia Solberg", "person", "Logistics. The dock runs on her board.", "Solberg routes Yarrow and keeps Halcyon’s berths from becoming a suggestion. If a crate is missing she already knows which skiff has it.", [["Role", "logistics"], ["Dock", "Halcyon"], ["Board", "paper"]]),
  node("quinn", "Havel Quinn", "person", "Magnetics. A guest who stayed.", "Quinn came for a week at the hut and measured Rim Harmonic against a magnetometer that still smells like solder. Calder lets him consult the array.", [["Role", "magnetics"], ["Guest", "Hut"], ["Tool", "mag"]]),
  node("ett", "Bosun Ett", "person", "Bosun of Cutter Bramble.", "Ett keeps Bramble, reports to Vale, and has opinions about every line in the harbor. The opinions are usually right.", [["Role", "bosun"], ["Ship", "Bramble"], ["Reports", "Vale"]]),

  node("tone", "Kestrel Tone", "signal", "A low repeating note under the shelf.", "Nineteen seconds, then a rest, then the note again. Calder named it. The ship was already called Kestrel. Neither side will change.", [["Period", "19 s"], ["Band", "low"], ["First", "2014"]]),
  node("chorus", "Brine Chorus", "signal", "A layered scrape recorded under fast ice.", "It sounds like a crowd clearing its throat. Voss thinks it is ice. Calder has not agreed out loud.", [["Band", "mid"], ["Site", "Camp Brine"], ["Season", "late winter"]]),
  node("knock", "Glass Knock", "signal", "A single hard tick off the glacier face.", "Northglass hears it first. Greer confirmed it by ear from the skiff, close enough to watch the face afterwards and see nothing move.", [["Shape", "impulse"], ["First ear", "Northglass"], ["Confirmed", "Greer"]]),
  node("pulse", "Long Pulse", "signal", "A swell of pressure with no surface weather to explain it.", "Hob has logged it three seasons. It echoes the Tone at a lazy interval, as if the note had a shadow.", [["Length", "minutes"], ["Logger", "Hob"], ["Kin", "Tone"]]),
  node("whisper", "Shear Whisper", "signal", "A thin shear along the uncharted slope.", "Orrery traced it. Glass Knock seems to precede it by hours. Harrow’s sketch of the slope is the best map there is.", [["Site", "slope"], ["Boat", "Orrery"], ["Kin", "Knock"]]),
  node("nullpocket", "Null Pocket", "signal", "A patch of water that records as silence.", "Lantern buoys ring it. Ambient noise drops out, cleanly, as if the sea had stepped out of the room. Pell says the tapes are lying.", [["Level", "near zero"], ["Marked", "Lantern"], ["Disputed", "Pell"]]),
  node("rim", "Rim Harmonic", "signal", "A tone on the boundary of the shelf.", "Southglass holds it best. Quinn’s magnetometer twitches in time with it, which nobody has a tidy explanation for.", [["Site", "shelf rim"], ["Lobe", "Southglass"], ["Mag", "correlates"]]),
  node("cadence", "Drift Cadence", "signal", "The rhythm of the ice edge at Floe Gate.", "Ships feel it as a shove every few minutes. Hob drifts with it. Kestrel has crossed it often enough to stop remarking on it.", [["Site", "Floe Gate"], ["Feel", "shove"], ["Logger", "Hob"]]),
  node("red", "Red Return", "signal", "An old tape that answers the Tone.", "Recorded years before Vesper existed, filed at Pell House, labeled in red pencil. It resembles the Tone closely enough that Pell checked it twice and then locked the drawer.", [["Year", "pre-2014"], ["Medium", "tape"], ["File", "Pell House"]]),
  node("shelf", "Quiet Shelf", "signal", "A deep quiet Orrery found under the chorus.", "Below the Brine Chorus the water goes still. Whisper sits under that still layer. The quiet has a floor.", [["Depth", "deep"], ["Boat", "Orrery"], ["Above", "Chorus"]]),
  node("harmonic", "Second Harmonic", "signal", "The Tone, one octave up, and thinner.", "It doubles the Kestrel Tone and muddies Rim Harmonic when both are loud. Calder treats it as a relative, not a new visitor.", [["Kin", "Tone"], ["Band", "upper"], ["Interferes", "Rim"]]),
  node("tick", "Ice Tick", "signal", "A metronome in the ice, caught by accident.", "Voss left a recorder running. The tick lines up with Long Pulse often enough to be rude. It has no agreed source.", [["Found", "Voss"], ["Site", "Camp Brine"], ["Kin", "Pulse"]]),
];

const TIES: readonly [string, string, string][] = [
  ["vesper", "northglass", "links"],
  ["vesper", "southglass", "links"],
  ["vesper", "kite", "relays"],
  ["vesper", "tone", "records"],
  ["calder", "vesper", "staffs"],
  ["hut", "vesper", "overlooks"],
  ["quill", "vesper", "tuned"],
  ["northglass", "knock", "hears"],
  ["southglass", "rim", "hears"],
  ["kite", "halcyon", "beams"],
  ["lantern", "kite", "relays"],
  ["lantern", "nullpocket", "marks"],
  ["greer", "lantern", "dropped"],
  ["voss", "brine", "winters"],
  ["brine", "chorus", "samples"],
  ["winch", "brine", "hauls"],
  ["pell", "hut", "keeps"],
  ["quinn", "hut", "guests"],
  ["halcyon", "kestrel", "berths"],
  ["halcyon", "marrow", "berths"],
  ["solberg", "halcyon", "runs"],
  ["salt", "yarrow", "caches"],
  ["pell", "pellhouse", "archives"],
  ["pellhouse", "red", "files"],
  ["pell", "red", "checked"],
  ["pell", "nullpocket", "disputes"],
  ["floe", "kestrel", "gates"],
  ["vale", "kestrel", "commands"],
  ["quill", "kestrel", "engineers"],
  ["kestrel", "marrow", "tows"],
  ["kestrel", "tone", "chases"],
  ["kestrel", "cadence", "crossed"],
  ["marrow", "skiff", "tends"],
  ["skiff", "greer", "carries"],
  ["kestrel", "orrery", "launches"],
  ["yarrow", "halcyon", "supplies"],
  ["bramble", "yarrow", "escorts"],
  ["ett", "bramble", "keeps"],
  ["solberg", "yarrow", "routes"],
  ["ett", "vale", "reports"],
  ["harrow", "orrery", "pilots"],
  ["orrery", "whisper", "traced"],
  ["orrery", "shelf", "dove"],
  ["harrow", "calder", "reports"],
  ["hob", "cadence", "drifts"],
  ["hob", "pulse", "logged"],
  ["floe", "cadence", "watches"],
  ["calder", "tone", "named"],
  ["calder", "greer", "mentors"],
  ["vale", "quill", "trusts"],
  ["quinn", "rim", "measured"],
  ["quinn", "vesper", "consulted"],
  ["greer", "knock", "confirmed"],
  ["voss", "tick", "caught"],
  ["harmonic", "tone", "doubles"],
  ["knock", "whisper", "precedes"],
  ["chorus", "shelf", "masks"],
  ["tick", "pulse", "ticks"],
  ["pulse", "tone", "echoes"],
  ["red", "tone", "resembles"],
  ["shelf", "whisper", "under"],
  ["skiff9", "lantern", "services"],
  ["skiff9", "salt", "returns"],
];

export const EDGES: readonly GraphEdge[] = TIES.map(([source, target, label], i) => ({
  id: `e${i}`,
  source,
  target,
  label,
}));

export type Chart = {
  id: string;
  kicker: string;
  blurb: string;
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  byId: ReadonlyMap<string, GraphNode>;
  degree: ReadonlyMap<string, number>;
};

export function indexChart(input: {
  id: string;
  kicker: string;
  blurb: string;
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
}): Chart {
  const byId = new Map(input.nodes.map((n) => [n.id, n]));
  const degree = new Map<string, number>();
  for (const edge of input.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }
  return { ...input, byId, degree };
}

export const STORY: Chart = indexChart({
  id: "story",
  kicker: "North Atlantic",
  blurb: "Listening posts, ships, and the sounds between them.",
  nodes: NODES,
  edges: EDGES,
});

export const NODE_BY_ID: ReadonlyMap<string, GraphNode> = STORY.byId;
export const DEGREE: ReadonlyMap<string, number> = STORY.degree;

export type Tie = {
  edge: GraphEdge;
  other: GraphNode;
  outbound: boolean;
};

export function tiesOf(chart: Chart, id: string): Tie[] {
  const list: Tie[] = [];
  for (const edge of chart.edges) {
    if (edge.source === id) {
      const other = chart.byId.get(edge.target);
      if (other) list.push({ edge, other, outbound: true });
    } else if (edge.target === id) {
      const other = chart.byId.get(edge.source);
      if (other) list.push({ edge, other, outbound: false });
    }
  }
  list.sort((a, b) => a.other.label.localeCompare(b.other.label));
  return list;
}

export type HitIndex = {
  nodes: Set<string>;
  edges: Set<string>;
};

export function searchChart(chart: Chart, query: string): HitIndex | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const nodes = new Set<string>();
  const edges = new Set<string>();
  for (const n of chart.nodes) {
    const kindLabel = KIND_LABEL[n.kind].toLowerCase();
    const kindHit = q.length >= 3 && (n.kind.startsWith(q) || kindLabel.startsWith(q));
    const factHit = n.facts.some((fact) => fact.k.toLowerCase().includes(q) || fact.v.toLowerCase().includes(q));
    if (
      kindHit ||
      factHit ||
      n.label.toLowerCase().includes(q) ||
      n.blurb.toLowerCase().includes(q) ||
      n.notes.toLowerCase().includes(q)
    ) {
      nodes.add(n.id);
    }
  }
  for (const edge of chart.edges) {
    if (edge.label.toLowerCase().includes(q)) {
      edges.add(edge.id);
      nodes.add(edge.source);
      nodes.add(edge.target);
    }
  }
  return { nodes, edges };
}

function assertGraph(): void {
  const ids = new Set<string>();
  for (const n of NODES) {
    if (ids.has(n.id)) throw new Error(`Duplicate node ${n.id}`);
    ids.add(n.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of EDGES) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      throw new Error(`Bad edge ${edge.id}: ${edge.source} → ${edge.target}`);
    }
    if (edge.source === edge.target) throw new Error(`Loop ${edge.id}`);
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate edge ${edge.id}`);
    edgeIds.add(edge.id);
  }
  for (const n of NODES) {
    if ((DEGREE.get(n.id) ?? 0) === 0) throw new Error(`Isolated node ${n.id}`);
  }
}

assertGraph();
