import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pause, i as Play, o as Flame, r as Search, s as Crosshair, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BkC0u4HB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KIND_LABEL = {
	post: "Posts",
	craft: "Craft",
	signal: "Signals",
	person: "People"
};
function node(id, label, kind, blurb, notes, facts) {
	return {
		id,
		label,
		kind,
		blurb,
		notes,
		facts: facts.map(([k, v]) => ({
			k,
			v
		}))
	};
}
var NODES = [
	node("vesper", "Vesper Array", "post", "Primary listening ring on the Svalbard shelf.", "Three concentric hydrophone rings sit under seasonal ice. The cleanest takes of the Kestrel Tone were cut here, between storms, when the array can hear its own clock.", [
		["Latitude", "79.4° N"],
		["Phones", "64"],
		["Since", "2014"]
	]),
	node("northglass", "Northglass", "post", "Northern lobe of the Vesper ring.", "A fan of phones aimed at the glacier face. Glass Knock shows up here first, a bright tick before the rest of the array agrees it happened.", [
		["Bearing", "012°"],
		["Phones", "16"],
		["Ice", "seasonal"]
	]),
	node("southglass", "Southglass", "post", "Southern lobe, pointed at open water.", "Less ice, more shipping noise. Rim Harmonic is clearest on this lobe, riding the boundary where shelf water meets the drift.", [
		["Bearing", "186°"],
		["Phones", "16"],
		["Traffic", "moderate"]
	]),
	node("lantern", "Lantern Field", "post", "A scatter of relay buoys west of the array.", "The buoys mark a patch of water that goes unnaturally quiet. Crews call the hole the Null Pocket and refuse to anchor in it overnight.", [
		["Buoys", "22"],
		["Depth", "140 m"],
		["Status", "active"]
	]),
	node("brine", "Camp Brine", "post", "Seasonal ice camp on the fast ice.", "A dozen tents, a winch, and a kettle that never quite boils. Brine Chorus is sampled here when the ice is thick enough to walk.", [
		["Season", "Feb–May"],
		["Crew", "6"],
		["Ice", "fast"]
	]),
	node("hut", "Hut Meridian", "post", "Ridge hut that gave the chart its name.", "One room, a stove, and the best view of Vesper. Visitors sign the beam. Arguments about the Tone usually start at the table.", [
		["Built", "1998"],
		["Bunks", "4"],
		["Radio", "HF"]
	]),
	node("halcyon", "Dock Halcyon", "post", "Supply harbor for the whole mesh.", "Everything that floats in this chart has tied up here at least once. The dockmaster’s board is more accurate than the official schedule.", [
		["Berths", "9"],
		["Fuel", "marine diesel"],
		["Ice", "kept open"]
	]),
	node("kite", "Relay Kite", "post", "Hilltop microwave hop above the dock.", "A shack and a dish the size of a dinner table. It carries Vesper’s takes to Halcyon when the undersea cable is sulking.", [
		["Link", "microwave"],
		["Uptime", "98%"],
		["Power", "wind"]
	]),
	node("salt", "Bunker Salt", "post", "Buried store for cable, fuel, and spare phones.", "Concrete, dry, and colder than the dock. Skiff Nine treats it as a second home between buoy runs.", [
		["Stores", "cable, phones"],
		["Access", "keyed"],
		["Temp", "2° C"]
	]),
	node("pellhouse", "Pell House", "post", "Shore archive of paper logs and tapes.", "Otto Pell will not let the originals leave the building. Red Return lives in a drawer he locks twice.", [
		["Holdings", "40 years"],
		["Format", "tape, paper"],
		["Town", "Longyearbyen"]
	]),
	node("winch", "Ridge Winch", "post", "Haul point above Camp Brine.", "A diesel winch bolted to rock. It lifts cores, tents, and occasionally a sulking scientist, when the ice road is the only road.", [
		["Lift", "1.2 t"],
		["Cable", "80 m"],
		["Fuel", "diesel"]
	]),
	node("floe", "Floe Gate", "post", "The ice edge the ships actually use.", "Not a building. A line on every watch bill: cross here, or wait. Drift Cadence is strongest just outside the gate.", [
		["Type", "ice edge"],
		["Watch", "24 h"],
		["Season", "year-round"]
	]),
	node("kestrel", "Icebreaker Kestrel", "craft", "The ship the Tone is named for, or the other way around.", "Painted bone above the waterline and rust below. She chases the Tone, launches Orrery, and still makes Halcyon for Sunday bread.", [
		["Class", "icebreaker"],
		["Crew", "18"],
		["Home", "Halcyon"]
	]),
	node("marrow", "Tender Marrow", "craft", "Workboat that keeps the skiffs honest.", "Short, stubborn, and usually towing something she was not designed to tow. If a phone is in the water, Marrow put it there or is about to pull it out.", [
		["Length", "18 m"],
		["Role", "tender"],
		["Parent", "Kestrel"]
	]),
	node("skiff", "Skiff Four", "craft", "Jonah Greer’s hydrophone skiff.", "An open boat with too many cables and one dry box. Four is the only skiff Greer trusts when the swell is confused.", [
		["Length", "6 m"],
		["Gear", "drop phones"],
		["Cox", "Greer"]
	]),
	node("orrery", "Submersible Orrery", "craft", "Deep boat for the layers under the shelf.", "A sphere, a lamp, and Ren Harrow’s handwriting on the checklist. She traced Shear Whisper along a slope nobody had charted twice.", [
		["Depth", "800 m"],
		["Crew", "2"],
		["Launch", "Kestrel"]
	]),
	node("bramble", "Cutter Bramble", "craft", "Escort and occasional ice taxi.", "Bosun Ett runs her like a kitchen: everything has a hook. She walks barges through the gate and shelters at Salt when the barometer drops.", [
		["Length", "24 m"],
		["Role", "escort"],
		["Cox", "Ett"]
	]),
	node("yarrow", "Barge Yarrow", "craft", "Fuel, food, and the mail.", "Unlovely and indispensable. Nia Solberg’s routing board lives in a plastic sleeve taped to the wheelhouse window.", [
		["Cargo", "fuel, stores"],
		["Route", "Halcyon loop"],
		["Draft", "shallow"]
	]),
	node("hob", "Drifter Hob", "craft", "Untethered buoy that goes where the cadence goes.", "No engine, no crew, a clock and a phone. Hob has logged Long Pulse three seasons running and has never once returned on schedule.", [
		["Type", "drifter"],
		["Track", "passive"],
		["Seasons", "3"]
	]),
	node("skiff9", "Skiff Nine", "craft", "Buoy tender for the Lantern Field.", "Nine services the relays and runs spares back to Bunker Salt. The crew paints a new tally mark on the thwart after every pocket crossing.", [
		["Length", "7 m"],
		["Route", "Lantern"],
		["Marks", "41"]
	]),
	node("calder", "Inez Calder", "person", "Acoustics lead. She named the Tone.", "Calder hears structure where other people hear weather. She staffs Vesper, mentors Greer, and still answers Harrow’s dives herself.", [
		["Role", "acoustics"],
		["Post", "Vesper"],
		["Since", "2011"]
	]),
	node("vale", "Soren Vale", "person", "Captain of Icebreaker Kestrel.", "Quiet on the bridge, particular about the gate. He trusts Mara Quill with the engines and does not pretend to understand the Tone.", [
		["Role", "captain"],
		["Ship", "Kestrel"],
		["Watch", "gate"]
	]),
	node("quill", "Mara Quill", "person", "Engineer. Keeps Vesper and Kestrel in the same key.", "Quill tuned the array’s clock to the ship’s, which is why the takes finally line up. Vale says the ship runs better when she is annoyed.", [
		["Role", "engineer"],
		["Ships", "Kestrel"],
		["Array", "clock"]
	]),
	node("harrow", "Ren Harrow", "person", "Pilot of Submersible Orrery.", "Harrow writes everything down twice and reports to Calder before the hatch is dry. The slope under Shear Whisper is sketched in the margin of a dive log.", [
		["Role", "pilot"],
		["Boat", "Orrery"],
		["Dives", "120"]
	]),
	node("pell", "Otto Pell", "person", "Archivist. Disputes the Null Pocket.", "Pell keeps Hut Meridian and the shore archive. He has a tape of Red Return he will play for you once, and a theory about the Pocket he will not drop.", [
		["Role", "archivist"],
		["House", "Pell House"],
		["Since", "1986"]
	]),
	node("voss", "Laila Voss", "person", "Ice radar, wintering at Camp Brine.", "Voss walks the same line of flags every morning and caught Ice Tick on a recorder she was not supposed to leave running.", [
		["Role", "ice radar"],
		["Camp", "Brine"],
		["Season", "winter"]
	]),
	node("greer", "Jonah Greer", "person", "Hydrophones. Lives on Skiff Four.", "Greer drops phones the way other people set a table. Calder trained him. He confirmed Glass Knock by ear before the plot agreed.", [
		["Role", "phones"],
		["Boat", "Skiff Four"],
		["Mentor", "Calder"]
	]),
	node("solberg", "Nia Solberg", "person", "Logistics. The dock runs on her board.", "Solberg routes Yarrow and keeps Halcyon’s berths from becoming a suggestion. If a crate is missing she already knows which skiff has it.", [
		["Role", "logistics"],
		["Dock", "Halcyon"],
		["Board", "paper"]
	]),
	node("quinn", "Havel Quinn", "person", "Magnetics. A guest who stayed.", "Quinn came for a week at the hut and measured Rim Harmonic against a magnetometer that still smells like solder. Calder lets him consult the array.", [
		["Role", "magnetics"],
		["Guest", "Hut"],
		["Tool", "mag"]
	]),
	node("ett", "Bosun Ett", "person", "Bosun of Cutter Bramble.", "Ett keeps Bramble, reports to Vale, and has opinions about every line in the harbor. The opinions are usually right.", [
		["Role", "bosun"],
		["Ship", "Bramble"],
		["Reports", "Vale"]
	]),
	node("tone", "Kestrel Tone", "signal", "A low repeating note under the shelf.", "Nineteen seconds, then a rest, then the note again. Calder named it. The ship was already called Kestrel. Neither side will change.", [
		["Period", "19 s"],
		["Band", "low"],
		["First", "2014"]
	]),
	node("chorus", "Brine Chorus", "signal", "A layered scrape recorded under fast ice.", "It sounds like a crowd clearing its throat. Voss thinks it is ice. Calder has not agreed out loud.", [
		["Band", "mid"],
		["Site", "Camp Brine"],
		["Season", "late winter"]
	]),
	node("knock", "Glass Knock", "signal", "A single hard tick off the glacier face.", "Northglass hears it first. Greer confirmed it by ear from the skiff, close enough to watch the face afterwards and see nothing move.", [
		["Shape", "impulse"],
		["First ear", "Northglass"],
		["Confirmed", "Greer"]
	]),
	node("pulse", "Long Pulse", "signal", "A swell of pressure with no surface weather to explain it.", "Hob has logged it three seasons. It echoes the Tone at a lazy interval, as if the note had a shadow.", [
		["Length", "minutes"],
		["Logger", "Hob"],
		["Kin", "Tone"]
	]),
	node("whisper", "Shear Whisper", "signal", "A thin shear along the uncharted slope.", "Orrery traced it. Glass Knock seems to precede it by hours. Harrow’s sketch of the slope is the best map there is.", [
		["Site", "slope"],
		["Boat", "Orrery"],
		["Kin", "Knock"]
	]),
	node("nullpocket", "Null Pocket", "signal", "A patch of water that records as silence.", "Lantern buoys ring it. Ambient noise drops out, cleanly, as if the sea had stepped out of the room. Pell says the tapes are lying.", [
		["Level", "near zero"],
		["Marked", "Lantern"],
		["Disputed", "Pell"]
	]),
	node("rim", "Rim Harmonic", "signal", "A tone on the boundary of the shelf.", "Southglass holds it best. Quinn’s magnetometer twitches in time with it, which nobody has a tidy explanation for.", [
		["Site", "shelf rim"],
		["Lobe", "Southglass"],
		["Mag", "correlates"]
	]),
	node("cadence", "Drift Cadence", "signal", "The rhythm of the ice edge at Floe Gate.", "Ships feel it as a shove every few minutes. Hob drifts with it. Kestrel has crossed it often enough to stop remarking on it.", [
		["Site", "Floe Gate"],
		["Feel", "shove"],
		["Logger", "Hob"]
	]),
	node("red", "Red Return", "signal", "An old tape that answers the Tone.", "Recorded years before Vesper existed, filed at Pell House, labeled in red pencil. It resembles the Tone closely enough that Pell checked it twice and then locked the drawer.", [
		["Year", "pre-2014"],
		["Medium", "tape"],
		["File", "Pell House"]
	]),
	node("shelf", "Quiet Shelf", "signal", "A deep quiet Orrery found under the chorus.", "Below the Brine Chorus the water goes still. Whisper sits under that still layer. The quiet has a floor.", [
		["Depth", "deep"],
		["Boat", "Orrery"],
		["Above", "Chorus"]
	]),
	node("harmonic", "Second Harmonic", "signal", "The Tone, one octave up, and thinner.", "It doubles the Kestrel Tone and muddies Rim Harmonic when both are loud. Calder treats it as a relative, not a new visitor.", [
		["Kin", "Tone"],
		["Band", "upper"],
		["Interferes", "Rim"]
	]),
	node("tick", "Ice Tick", "signal", "A metronome in the ice, caught by accident.", "Voss left a recorder running. The tick lines up with Long Pulse often enough to be rude. It has no agreed source.", [
		["Found", "Voss"],
		["Site", "Camp Brine"],
		["Kin", "Pulse"]
	])
];
var EDGES = [
	[
		"vesper",
		"northglass",
		"links"
	],
	[
		"vesper",
		"southglass",
		"links"
	],
	[
		"vesper",
		"kite",
		"relays"
	],
	[
		"vesper",
		"tone",
		"records"
	],
	[
		"calder",
		"vesper",
		"staffs"
	],
	[
		"hut",
		"vesper",
		"overlooks"
	],
	[
		"quill",
		"vesper",
		"tuned"
	],
	[
		"northglass",
		"knock",
		"hears"
	],
	[
		"southglass",
		"rim",
		"hears"
	],
	[
		"kite",
		"halcyon",
		"beams"
	],
	[
		"lantern",
		"kite",
		"relays"
	],
	[
		"lantern",
		"nullpocket",
		"marks"
	],
	[
		"greer",
		"lantern",
		"dropped"
	],
	[
		"voss",
		"brine",
		"winters"
	],
	[
		"brine",
		"chorus",
		"samples"
	],
	[
		"winch",
		"brine",
		"hauls"
	],
	[
		"pell",
		"hut",
		"keeps"
	],
	[
		"quinn",
		"hut",
		"guests"
	],
	[
		"halcyon",
		"kestrel",
		"berths"
	],
	[
		"halcyon",
		"marrow",
		"berths"
	],
	[
		"solberg",
		"halcyon",
		"runs"
	],
	[
		"salt",
		"yarrow",
		"caches"
	],
	[
		"pell",
		"pellhouse",
		"archives"
	],
	[
		"pellhouse",
		"red",
		"files"
	],
	[
		"pell",
		"red",
		"checked"
	],
	[
		"pell",
		"nullpocket",
		"disputes"
	],
	[
		"floe",
		"kestrel",
		"gates"
	],
	[
		"vale",
		"kestrel",
		"commands"
	],
	[
		"quill",
		"kestrel",
		"engineers"
	],
	[
		"kestrel",
		"marrow",
		"tows"
	],
	[
		"kestrel",
		"tone",
		"chases"
	],
	[
		"kestrel",
		"cadence",
		"crossed"
	],
	[
		"marrow",
		"skiff",
		"tends"
	],
	[
		"skiff",
		"greer",
		"carries"
	],
	[
		"kestrel",
		"orrery",
		"launches"
	],
	[
		"yarrow",
		"halcyon",
		"supplies"
	],
	[
		"bramble",
		"yarrow",
		"escorts"
	],
	[
		"ett",
		"bramble",
		"keeps"
	],
	[
		"solberg",
		"yarrow",
		"routes"
	],
	[
		"ett",
		"vale",
		"reports"
	],
	[
		"harrow",
		"orrery",
		"pilots"
	],
	[
		"orrery",
		"whisper",
		"traced"
	],
	[
		"orrery",
		"shelf",
		"dove"
	],
	[
		"harrow",
		"calder",
		"reports"
	],
	[
		"hob",
		"cadence",
		"drifts"
	],
	[
		"hob",
		"pulse",
		"logged"
	],
	[
		"floe",
		"cadence",
		"watches"
	],
	[
		"calder",
		"tone",
		"named"
	],
	[
		"calder",
		"greer",
		"mentors"
	],
	[
		"vale",
		"quill",
		"trusts"
	],
	[
		"quinn",
		"rim",
		"measured"
	],
	[
		"quinn",
		"vesper",
		"consulted"
	],
	[
		"greer",
		"knock",
		"confirmed"
	],
	[
		"voss",
		"tick",
		"caught"
	],
	[
		"harmonic",
		"tone",
		"doubles"
	],
	[
		"knock",
		"whisper",
		"precedes"
	],
	[
		"chorus",
		"shelf",
		"masks"
	],
	[
		"tick",
		"pulse",
		"ticks"
	],
	[
		"pulse",
		"tone",
		"echoes"
	],
	[
		"red",
		"tone",
		"resembles"
	],
	[
		"shelf",
		"whisper",
		"under"
	],
	[
		"skiff9",
		"lantern",
		"services"
	],
	[
		"skiff9",
		"salt",
		"returns"
	]
].map(([source, target, label], i) => ({
	id: `e${i}`,
	source,
	target,
	label
}));
var NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));
var DEGREE = (() => {
	const degree = /* @__PURE__ */ new Map();
	for (const edge of EDGES) {
		degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
		degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
	}
	return degree;
})();
function tiesOf(id) {
	const list = [];
	for (const edge of EDGES) if (edge.source === id) {
		const other = NODE_BY_ID.get(edge.target);
		if (other) list.push({
			edge,
			other,
			outbound: true
		});
	} else if (edge.target === id) {
		const other = NODE_BY_ID.get(edge.source);
		if (other) list.push({
			edge,
			other,
			outbound: false
		});
	}
	list.sort((a, b) => a.other.label.localeCompare(b.other.label));
	return list;
}
function searchChart(query) {
	const q = query.trim().toLowerCase();
	if (!q) return null;
	const nodes = /* @__PURE__ */ new Set();
	const edges = /* @__PURE__ */ new Set();
	for (const n of NODES) {
		const kindLabel = KIND_LABEL[n.kind].toLowerCase();
		if (q.length >= 3 && (n.kind.startsWith(q) || kindLabel.startsWith(q)) || n.label.toLowerCase().includes(q) || n.blurb.toLowerCase().includes(q)) nodes.add(n.id);
	}
	for (const edge of EDGES) if (edge.label.toLowerCase().includes(q)) {
		edges.add(edge.id);
		nodes.add(edge.source);
		nodes.add(edge.target);
	}
	return {
		nodes,
		edges
	};
}
function assertGraph() {
	const ids = /* @__PURE__ */ new Set();
	for (const n of NODES) {
		if (ids.has(n.id)) throw new Error(`Duplicate node ${n.id}`);
		ids.add(n.id);
	}
	const edgeIds = /* @__PURE__ */ new Set();
	for (const edge of EDGES) {
		if (!ids.has(edge.source) || !ids.has(edge.target)) throw new Error(`Bad edge ${edge.id}: ${edge.source} → ${edge.target}`);
		if (edge.source === edge.target) throw new Error(`Loop ${edge.id}`);
		if (edgeIds.has(edge.id)) throw new Error(`Duplicate edge ${edge.id}`);
		edgeIds.add(edge.id);
	}
	for (const n of NODES) if ((DEGREE.get(n.id) ?? 0) === 0) throw new Error(`Isolated node ${n.id}`);
}
assertGraph();
var ALPHA_MIN = .02;
var CHARGE = 2600;
var LINK_K = .042;
var CENTER = .0014;
var DAMP = .72;
var CUTOFF2 = 115600;
var SPEED = 8;
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
var SECTOR = {
	post: -.5,
	craft: 1.15,
	signal: 2.75,
	person: 4.35
};
function createSim() {
	const rand = mulberry32(11);
	const seen = {
		post: 0,
		craft: 0,
		signal: 0,
		person: 0
	};
	const totals = {
		post: 0,
		craft: 0,
		signal: 0,
		person: 0
	};
	for (const n of NODES) totals[n.kind] += 1;
	const index = new Map(NODES.map((n, i) => [n.id, i]));
	const nodes = NODES.map((n) => {
		const i = seen[n.kind];
		seen[n.kind] = i + 1;
		const count = Math.max(1, totals[n.kind]);
		const ang = SECTOR[n.kind] + i / count * 1.2;
		const rad = 170 + i % 4 * 48;
		const deg = DEGREE.get(n.id) ?? 1;
		return {
			id: n.id,
			kind: n.kind,
			x: Math.cos(ang) * rad + (rand() - .5) * 18,
			y: Math.sin(ang) * rad + (rand() - .5) * 18,
			vx: 0,
			vy: 0,
			r: 7.5 + Math.sqrt(deg) * 2.5,
			fixed: false
		};
	});
	const sim = {
		nodes,
		links: EDGES.map((edge) => {
			const source = index.get(edge.source);
			const target = index.get(edge.target);
			if (source === void 0 || target === void 0) throw new Error(`Missing endpoint ${edge.id}`);
			return {
				source,
				target,
				rest: nodes[source].kind === nodes[target].kind ? 78 : 132
			};
		}),
		alpha: 1,
		frozen: false
	};
	for (let i = 0; i < 120; i += 1) step(sim);
	return sim;
}
function reheat(sim) {
	sim.frozen = false;
	sim.alpha = 1;
}
/** Integrate one frame. Returns false once the layout has cooled or is frozen. */
function step(sim) {
	if (sim.frozen || sim.alpha < .02) return false;
	const { nodes, links } = sim;
	const a = sim.alpha;
	const n = nodes.length;
	for (let i = 0; i < n; i += 1) {
		const p = nodes[i];
		for (let j = i + 1; j < n; j += 1) {
			const q = nodes[j];
			let dx = p.x - q.x;
			let dy = p.y - q.y;
			let d2 = dx * dx + dy * dy;
			if (d2 < 1) {
				dx = .05 * (i - j || 1);
				dy = .05;
				d2 = dx * dx + dy * dy;
			}
			if (d2 > CUTOFF2) continue;
			const d = Math.sqrt(d2);
			const f = CHARGE / d2 * a;
			const fx = dx / d * f;
			const fy = dy / d * f;
			if (!p.fixed) {
				p.vx += fx;
				p.vy += fy;
			}
			if (!q.fixed) {
				q.vx -= fx;
				q.vy -= fy;
			}
		}
	}
	for (const link of links) {
		const p = nodes[link.source];
		const q = nodes[link.target];
		const dx = q.x - p.x;
		const dy = q.y - p.y;
		const d = Math.hypot(dx, dy) || .01;
		const f = (d - link.rest) * LINK_K * a;
		const fx = dx / d * f;
		const fy = dy / d * f;
		if (!p.fixed) {
			p.vx += fx;
			p.vy += fy;
		}
		if (!q.fixed) {
			q.vx -= fx;
			q.vy -= fy;
		}
	}
	for (const p of nodes) {
		if (p.fixed) {
			p.vx = 0;
			p.vy = 0;
			continue;
		}
		p.vx -= p.x * CENTER * a;
		p.vy -= p.y * CENTER * a;
		p.vx *= DAMP;
		p.vy *= DAMP;
		const sp = Math.hypot(p.vx, p.vy);
		if (sp > SPEED) {
			const scale = SPEED / sp;
			p.vx *= scale;
			p.vy *= scale;
		}
		p.x += p.vx;
		p.y += p.vy;
	}
	for (let pass = 0; pass < 2; pass += 1) for (let i = 0; i < n; i += 1) {
		const p = nodes[i];
		for (let j = i + 1; j < n; j += 1) {
			const q = nodes[j];
			const dx = q.x - p.x;
			const dy = q.y - p.y;
			const min = p.r + q.r + 12;
			const d2 = dx * dx + dy * dy;
			if (d2 >= min * min || d2 === 0) continue;
			const d = Math.sqrt(d2);
			const overlap = min - d;
			const ux = dx / d;
			const uy = dy / d;
			if (!p.fixed && !q.fixed) {
				p.x -= ux * overlap * .5;
				p.y -= uy * overlap * .5;
				q.x += ux * overlap * .5;
				q.y += uy * overlap * .5;
			} else if (!p.fixed) {
				p.x -= ux * overlap;
				p.y -= uy * overlap;
			} else if (!q.fixed) {
				q.x += ux * overlap;
				q.y += uy * overlap;
			}
		}
	}
	sim.alpha *= .988;
	return sim.alpha >= ALPHA_MIN;
}
var FALLBACK = {
	ink: "#0c1210",
	line: "#2c3b33",
	bone: "#e6efe6",
	mist: "#93a399",
	brass: "#e0a84a",
	sage: "#7eae92",
	clay: "#d08462"
};
var K_MIN = .28;
var K_MAX = 2.8;
function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}
function ease(t) {
	return 1 - (1 - t) ** 3;
}
function kindColor(kind, pal) {
	if (kind === "post") return pal.brass;
	if (kind === "craft") return pal.sage;
	if (kind === "person") return pal.clay;
	return pal.bone;
}
function withAlpha(color, alpha) {
	if (color.startsWith("#") && color.length === 7) {
		const n = Number.parseInt(color.slice(1), 16);
		return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${alpha})`;
	}
	return color;
}
function readPalette() {
	const css = getComputedStyle(document.documentElement);
	const pick = (name) => css.getPropertyValue(`--color-${name}`).trim() || FALLBACK[name];
	return {
		ink: pick("ink"),
		line: pick("line"),
		bone: pick("bone"),
		mist: pick("mist"),
		brass: pick("brass"),
		sage: pick("sage"),
		clay: pick("clay")
	};
}
function createChartState() {
	const sim = createSim();
	return {
		sim,
		byId: new Map(sim.nodes.map((n) => [n.id, n])),
		cam: {
			x: 0,
			y: 0,
			k: 1
		},
		anim: null,
		canvas: null,
		ctx: null,
		pal: FALLBACK,
		w: 1,
		h: 1,
		dpr: 1,
		query: "",
		queryKey: "\0",
		hits: null,
		selectedId: null,
		hoverId: null,
		frozenProp: false,
		phase: "live",
		raf: 0,
		alive: true,
		ready: false,
		didFit: false,
		reduce: false,
		drag: null,
		panning: false,
		down: null,
		lastPan: null,
		pointers: /* @__PURE__ */ new Map(),
		pinch: null,
		onSelect: () => {},
		onPhase: () => {}
	};
}
function localPoint(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top
	};
}
function hitNode(st, x, y) {
	const wx = (x - st.cam.x) / st.cam.k;
	const wy = (y - st.cam.y) / st.cam.k;
	let best = null;
	let bestD = Infinity;
	for (const n of st.sim.nodes) {
		const reach = n.r + 8 / st.cam.k;
		const d = (n.x - wx) ** 2 + (n.y - wy) ** 2;
		if (d <= reach * reach && d < bestD) {
			best = n;
			bestD = d;
		}
	}
	return best;
}
function overlap(a, b) {
	return Math.abs(a.x - b.x) * 2 < a.w + b.w + 6 && Math.abs(a.y - b.y) * 2 < a.h + b.h + 4;
}
function visibleCenter(st) {
	const narrow = st.w < 768;
	const padT = narrow ? 148 : 96;
	const padB = narrow ? 96 : 84;
	return {
		x: st.w / 2,
		y: (padT + (st.h - padB)) / 2,
		padT,
		padB
	};
}
function fitCamera(st, ids) {
	const allow = ids ? new Set(ids) : null;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	let any = false;
	for (const n of st.sim.nodes) {
		if (allow && !allow.has(n.id)) continue;
		any = true;
		minX = Math.min(minX, n.x - n.r);
		minY = Math.min(minY, n.y - n.r);
		maxX = Math.max(maxX, n.x + n.r);
		maxY = Math.max(maxY, n.y + n.r);
	}
	if (!any) return null;
	const bw = Math.max(48, maxX - minX);
	const bh = Math.max(48, maxY - minY);
	const { x: vx, y: vy, padT, padB } = visibleCenter(st);
	const k = clamp(Math.min((st.w - 112) / bw, (st.h - padT - padB) / bh), K_MIN, K_MAX);
	const cx = (minX + maxX) / 2;
	const cy = (minY + maxY) / 2;
	return {
		k,
		x: vx - cx * k,
		y: vy - cy * k
	};
}
function focusCamera(st, id) {
	const n = st.byId.get(id);
	if (!n) return null;
	const { x: vx, y: vy } = visibleCenter(st);
	const k = clamp(Math.max(st.cam.k, 1.25), K_MIN, K_MAX);
	return {
		k,
		x: vx - n.x * k,
		y: vy - n.y * k
	};
}
function animateTo(st, to) {
	if (!to) return;
	if (st.reduce) {
		st.cam.x = to.x;
		st.cam.y = to.y;
		st.cam.k = to.k;
		st.anim = null;
		return;
	}
	st.anim = {
		from: { ...st.cam },
		to,
		start: performance.now(),
		dur: 280
	};
}
function tickCam(st) {
	const anim = st.anim;
	if (!anim) return false;
	const t = anim.dur <= 0 ? 1 : Math.min(1, (performance.now() - anim.start) / anim.dur);
	const u = ease(t);
	st.cam.x = anim.from.x + (anim.to.x - anim.from.x) * u;
	st.cam.y = anim.from.y + (anim.to.y - anim.from.y) * u;
	st.cam.k = anim.from.k + (anim.to.k - anim.from.k) * u;
	if (t >= 1) st.anim = null;
	return st.anim !== null;
}
function resize(st) {
	const canvas = st.canvas;
	if (!canvas) return;
	const rect = canvas.getBoundingClientRect();
	const w = Math.max(1, rect.width);
	const h = Math.max(1, rect.height);
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	const bw = Math.round(w * dpr);
	const bh = Math.round(h * dpr);
	if (canvas.width !== bw || canvas.height !== bh) {
		canvas.width = bw;
		canvas.height = bh;
	}
	st.w = w;
	st.h = h;
	st.dpr = dpr;
}
function syncHits(st) {
	if (st.queryKey === st.query) return;
	st.queryKey = st.query;
	st.hits = searchChart(st.query);
}
function drawShape(ctx, n, k) {
	const r = n.r;
	ctx.beginPath();
	if (n.kind === "craft") {
		ctx.moveTo(n.x, n.y - r);
		ctx.lineTo(n.x + r, n.y);
		ctx.lineTo(n.x, n.y + r);
		ctx.lineTo(n.x - r, n.y);
		ctx.closePath();
		return;
	}
	if (n.kind === "post") {
		const s = r * .92;
		ctx.rect(n.x - s, n.y - s, s * 2, s * 2);
		return;
	}
	ctx.arc(n.x, n.y, n.kind === "signal" ? r : r * .92, 0, Math.PI * 2);
}
function draw(st) {
	const ctx = st.ctx;
	if (!ctx) return;
	const { pal, cam, w, h, dpr } = st;
	const k = cam.k;
	syncHits(st);
	const hits = st.hits;
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.fillStyle = pal.ink;
	ctx.fillRect(0, 0, w, h);
	ctx.save();
	ctx.translate(cam.x, cam.y);
	ctx.scale(k, k);
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.globalAlpha = .55;
	ctx.strokeStyle = pal.line;
	ctx.lineWidth = 1 / k;
	for (const rad of [
		150,
		280,
		430
	]) {
		ctx.beginPath();
		ctx.arc(0, 0, rad, 0, Math.PI * 2);
		ctx.stroke();
	}
	ctx.globalAlpha = .45;
	ctx.fillStyle = pal.mist;
	ctx.font = `${12 / k}px Outfit, sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "bottom";
	ctx.fillText("N", 0, -442);
	ctx.globalAlpha = 1;
	const edges = [];
	for (let i = 0; i < EDGES.length; i += 1) {
		const edge = EDGES[i];
		const a = st.byId.get(edge.source);
		const b = st.byId.get(edge.target);
		if (!a || !b) continue;
		let rank = 1;
		if (hits) {
			const hot = hits.edges.has(edge.id) || hits.nodes.has(a.id) && hits.nodes.has(b.id);
			const touch = hits.nodes.has(a.id) || hits.nodes.has(b.id);
			rank = hot ? 2 : touch ? 1 : 0;
		} else if (st.selectedId === a.id || st.selectedId === b.id || st.hoverId === a.id || st.hoverId === b.id) rank = 2;
		edges.push({
			a,
			b,
			id: edge.id,
			label: edge.label,
			rank
		});
	}
	const strokeRank = (rank, alpha, color, width) => {
		ctx.beginPath();
		let any = false;
		for (const edge of edges) {
			if (edge.rank !== rank) continue;
			ctx.moveTo(edge.a.x, edge.a.y);
			ctx.lineTo(edge.b.x, edge.b.y);
			any = true;
		}
		if (!any) return;
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = color;
		ctx.lineWidth = width / k;
		ctx.stroke();
	};
	strokeRank(0, .08, pal.mist, 1);
	strokeRank(1, hits ? .28 : .55, pal.mist, 1);
	strokeRank(2, .95, pal.brass, 1.7);
	ctx.globalAlpha = 1;
	const nodeAlpha = (n) => {
		if (!hits) return 1;
		return hits.nodes.has(n.id) ? 1 : .16;
	};
	const paintNode = (n) => {
		const alpha = nodeAlpha(n);
		const color = kindColor(n.kind, pal);
		ctx.globalAlpha = alpha;
		drawShape(ctx, n, k);
		if (n.kind === "signal") {
			ctx.strokeStyle = color;
			ctx.lineWidth = 1.6 / k;
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(n.x, n.y, Math.max(1.4, n.r * .22), 0, Math.PI * 2);
			ctx.fillStyle = color;
			ctx.fill();
		} else {
			ctx.fillStyle = color;
			ctx.fill();
		}
		const selected = st.selectedId === n.id;
		const hover = st.hoverId === n.id;
		const matched = Boolean(hits?.nodes.has(n.id));
		if (selected || hover || matched) {
			ctx.beginPath();
			ctx.arc(n.x, n.y, n.r + (selected ? 7 : 5) / k, 0, Math.PI * 2);
			ctx.strokeStyle = selected ? pal.brass : hover ? pal.bone : color;
			ctx.lineWidth = (selected ? 1.7 : 1.1) / k;
			ctx.stroke();
		}
	};
	const ordered = [...st.sim.nodes].sort((a, b) => nodeAlpha(a) - nodeAlpha(b));
	for (const n of ordered) paintNode(n);
	ctx.globalAlpha = 1;
	ctx.restore();
	ctx.font = "500 12px Outfit, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	const boxes = [];
	for (const n of st.sim.nodes) {
		const sx = n.x * k + cam.x;
		const sy = n.y * k + cam.y;
		const sr = Math.max(6, n.r * k);
		if (sx < -40 || sy < -40 || sx > w + 40 || sy > h + 40) continue;
		boxes.push({
			x: sx,
			y: sy,
			w: sr * 2 + 6,
			h: sr * 2 + 6
		});
	}
	const labels = [];
	const labelsOn = k >= .78;
	for (const n of st.sim.nodes) {
		const sx = n.x * k + cam.x;
		const sy = n.y * k + cam.y;
		const sr = n.r * k;
		if (sx < -80 || sy < -80 || sx > w + 80 || sy > h + 80) continue;
		const selected = st.selectedId === n.id;
		const hover = st.hoverId === n.id;
		const matched = Boolean(hits?.nodes.has(n.id));
		if (hits && !matched && !selected && !hover) continue;
		if (!hits && !labelsOn && !selected && !hover) continue;
		const datum = NODE_BY_ID.get(n.id);
		if (!datum) continue;
		const text = datum.label;
		const width = ctx.measureText(text).width;
		const box = {
			x: sx,
			y: sy + sr + 12,
			w: width,
			h: 14
		};
		const pri = selected ? 100 : hover ? 80 : matched ? 70 : 30;
		const dim = Boolean(hits && !matched);
		labels.push({
			pri,
			box,
			paint: () => {
				ctx.font = "500 12px Outfit, sans-serif";
				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				ctx.fillStyle = dim ? withAlpha(pal.mist, .7) : pal.bone;
				ctx.fillText(text, sx, sy + sr + 4);
			}
		});
	}
	ctx.font = "500 11px Outfit, sans-serif";
	ctx.textBaseline = "middle";
	for (const edge of edges) {
		const x1 = edge.a.x * k + cam.x;
		const y1 = edge.a.y * k + cam.y;
		const x2 = edge.b.x * k + cam.x;
		const y2 = edge.b.y * k + cam.y;
		const mx = (x1 + x2) / 2;
		const my = (y1 + y2) / 2;
		const len = Math.hypot(x2 - x1, y2 - y1);
		const hot = edge.rank === 2;
		if (!hot && (!labelsOn || len < 64 || len > 520)) continue;
		if (hot && len < 36) continue;
		if (mx < -40 || my < -40 || mx > w + 40 || my > h + 40) continue;
		const width = ctx.measureText(edge.label).width;
		const box = {
			x: mx,
			y: my,
			w: width + 10,
			h: 16
		};
		labels.push({
			pri: hot ? 60 : 20,
			box,
			paint: () => {
				let ang = Math.atan2(y2 - y1, x2 - x1);
				if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
				ctx.save();
				ctx.translate(mx, my);
				ctx.rotate(ang);
				ctx.font = "500 11px Outfit, sans-serif";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillStyle = withAlpha(pal.ink, .84);
				ctx.beginPath();
				ctx.roundRect(-width / 2 - 4, -8, width + 8, 16, 4);
				ctx.fill();
				ctx.fillStyle = hot ? pal.brass : pal.mist;
				ctx.fillText(edge.label, 0, 0);
				ctx.restore();
			}
		});
	}
	labels.sort((a, b) => b.pri - a.pri);
	let drawn = 0;
	for (const label of labels) {
		if (drawn > 70) break;
		if (boxes.some((box) => overlap(box, label.box))) continue;
		boxes.push(label.box);
		label.paint();
		drawn += 1;
	}
}
function renderFrame(st) {
	if (!st.alive || !st.canvas || !st.ctx) return false;
	resize(st);
	if (!st.didFit && st.w > 2 && st.h > 2) {
		const cam = fitCamera(st, null);
		if (cam) {
			st.cam = cam;
			st.didFit = true;
		}
	}
	const moving = step(st.sim);
	const camActive = tickCam(st);
	draw(st);
	const phase = st.sim.frozen ? "frozen" : st.sim.alpha >= .02 ? "live" : "settled";
	if (phase !== st.phase) {
		st.phase = phase;
		st.onPhase(phase);
	}
	return moving || camActive || st.drag !== null || st.panning;
}
function wake(st) {
	if (!st.alive || st.raf) return;
	const loop = () => {
		st.raf = renderFrame(st) ? requestAnimationFrame(loop) : 0;
	};
	st.raf = requestAnimationFrame(loop);
}
function applyPinch(st) {
	const pinch = st.pinch;
	const canvas = st.canvas;
	if (!pinch || !canvas || st.pointers.size < 2) return;
	const pts = [...st.pointers.values()];
	const a = pts[0];
	const b = pts[1];
	if (!a || !b) return;
	const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
	const midX = (a.x + b.x) / 2;
	const midY = (a.y + b.y) / 2;
	const k = clamp(pinch.k * (dist / pinch.dist), K_MIN, K_MAX);
	st.cam.k = k;
	st.cam.x = midX - pinch.wx * k;
	st.cam.y = midY - pinch.wy * k;
	st.anim = null;
}
var ForceGraph = (0, import_react.forwardRef)(function ForceGraph({ query, selectedId, frozen, onSelect, onPhase }, ref) {
	const stRef = (0, import_react.useRef)(null);
	if (stRef.current === null) stRef.current = createChartState();
	const canvasRef = (0, import_react.useRef)(null);
	const st = stRef.current;
	st.query = query;
	st.selectedId = selectedId;
	st.frozenProp = frozen;
	st.sim.frozen = frozen;
	st.onSelect = onSelect;
	st.onPhase = onPhase;
	(0, import_react.useImperativeHandle)(ref, () => ({
		reheat() {
			const current = stRef.current;
			if (!current) return;
			reheat(current.sim);
			wake(current);
		},
		fitAll() {
			const current = stRef.current;
			if (!current) return;
			animateTo(current, fitCamera(current, null));
			wake(current);
		},
		fitIds(ids) {
			const current = stRef.current;
			if (!current) return;
			animateTo(current, fitCamera(current, ids));
			wake(current);
		},
		focus(id) {
			const current = stRef.current;
			if (!current) return;
			animateTo(current, focusCamera(current, id));
			wake(current);
		}
	}));
	(0, import_react.useEffect)(() => {
		const current = stRef.current;
		if (!current) return;
		current.query = query;
		current.selectedId = selectedId;
		current.sim.frozen = frozen;
		if (current.ready) wake(current);
	}, [
		query,
		selectedId,
		frozen
	]);
	(0, import_react.useEffect)(() => {
		const current = stRef.current;
		const canvas = canvasRef.current;
		if (!current || !canvas) return;
		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) return;
		current.canvas = canvas;
		current.ctx = ctx;
		current.pal = readPalette();
		current.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		current.alive = true;
		current.ready = true;
		canvas.style.cursor = "grab";
		const onPointerDown = (event) => {
			const p = localPoint(canvas, event);
			current.pointers.set(event.pointerId, p);
			try {
				canvas.setPointerCapture(event.pointerId);
			} catch {}
			if (current.pointers.size >= 2) {
				if (current.drag) current.drag.fixed = false;
				current.drag = null;
				current.panning = false;
				current.down = null;
				const pts = [...current.pointers.values()];
				const a = pts[0];
				const b = pts[1];
				if (!a || !b) return;
				const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
				const midX = (a.x + b.x) / 2;
				const midY = (a.y + b.y) / 2;
				current.pinch = {
					dist,
					k: current.cam.k,
					wx: (midX - current.cam.x) / current.cam.k,
					wy: (midY - current.cam.y) / current.cam.k
				};
				current.anim = null;
				wake(current);
				return;
			}
			const node = hitNode(current, p.x, p.y);
			current.anim = null;
			current.down = {
				x: p.x,
				y: p.y,
				moved: false,
				nodeId: node?.id ?? null
			};
			current.lastPan = p;
			if (node) {
				node.fixed = true;
				current.drag = node;
				current.onSelect(node.id);
				canvas.style.cursor = "grabbing";
			} else {
				current.panning = true;
				canvas.style.cursor = "grabbing";
			}
			wake(current);
		};
		const onPointerMove = (event) => {
			const p = localPoint(canvas, event);
			if (!current.pointers.has(event.pointerId)) {
				const id = hitNode(current, p.x, p.y)?.id ?? null;
				if (id !== current.hoverId) {
					current.hoverId = id;
					canvas.style.cursor = id ? "pointer" : "grab";
					wake(current);
				}
				return;
			}
			current.pointers.set(event.pointerId, p);
			if (current.pointers.size >= 2 && current.pinch) {
				applyPinch(current);
				wake(current);
				return;
			}
			const down = current.down;
			if (!down) return;
			const dx = p.x - down.x;
			const dy = p.y - down.y;
			if (!down.moved && dx * dx + dy * dy > 16) down.moved = true;
			if (current.drag) {
				const wx = (p.x - current.cam.x) / current.cam.k;
				const wy = (p.y - current.cam.y) / current.cam.k;
				current.drag.vx = (wx - current.drag.x) * .45;
				current.drag.vy = (wy - current.drag.y) * .45;
				current.drag.x = wx;
				current.drag.y = wy;
				if (!current.sim.frozen) current.sim.alpha = Math.max(current.sim.alpha, .35);
			} else if (current.panning && current.lastPan) {
				current.cam.x += p.x - current.lastPan.x;
				current.cam.y += p.y - current.lastPan.y;
				current.lastPan = p;
			}
			wake(current);
		};
		const endPointer = (event) => {
			current.pointers.delete(event.pointerId);
			if (current.pointers.size < 2) current.pinch = null;
			if (current.pointers.size > 0) {
				wake(current);
				return;
			}
			const down = current.down;
			if (current.drag) {
				current.drag.fixed = false;
				current.drag = null;
			}
			if (down && !down.moved && !down.nodeId) current.onSelect(null);
			current.panning = false;
			current.down = null;
			current.lastPan = null;
			canvas.style.cursor = "grab";
			wake(current);
		};
		const onWheel = (event) => {
			event.preventDefault();
			const p = localPoint(canvas, event);
			let dy = event.deltaY;
			if (event.deltaMode === 1) dy *= 16;
			if (event.deltaMode === 2) dy *= 100;
			const factor = Math.exp(-dy * .0014);
			const next = clamp(current.cam.k * factor, K_MIN, K_MAX);
			const wx = (p.x - current.cam.x) / current.cam.k;
			const wy = (p.y - current.cam.y) / current.cam.k;
			current.cam.k = next;
			current.cam.x = p.x - wx * next;
			current.cam.y = p.y - wy * next;
			current.anim = null;
			wake(current);
		};
		const onDoubleClick = (event) => {
			event.preventDefault();
			const p = localPoint(canvas, event);
			const node = hitNode(current, p.x, p.y);
			if (node) animateTo(current, focusCamera(current, node.id));
			else animateTo(current, fitCamera(current, null));
			wake(current);
		};
		const observer = new ResizeObserver(() => wake(current));
		observer.observe(canvas);
		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointermove", onPointerMove);
		canvas.addEventListener("pointerup", endPointer);
		canvas.addEventListener("pointercancel", endPointer);
		canvas.addEventListener("wheel", onWheel, { passive: false });
		canvas.addEventListener("dblclick", onDoubleClick);
		const fonts = document.fonts;
		const onFonts = () => wake(current);
		fonts?.addEventListener("loadingdone", onFonts);
		fonts?.ready.then(onFonts);
		resize(current);
		wake(current);
		return () => {
			current.alive = false;
			current.ready = false;
			if (current.raf) cancelAnimationFrame(current.raf);
			current.raf = 0;
			observer.disconnect();
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointermove", onPointerMove);
			canvas.removeEventListener("pointerup", endPointer);
			canvas.removeEventListener("pointercancel", endPointer);
			canvas.removeEventListener("wheel", onWheel);
			canvas.removeEventListener("dblclick", onDoubleClick);
			fonts?.removeEventListener("loadingdone", onFonts);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "absolute inset-0 h-full w-full touch-none",
		"aria-label": "Force-directed chart. Drag a mark to move it, drag empty space to pan, scroll or pinch to zoom."
	});
});
var LEGEND = [
	{
		kind: "post",
		label: "Posts",
		query: "posts",
		swatch: "bg-brass"
	},
	{
		kind: "craft",
		label: "Craft",
		query: "craft",
		swatch: "rotate-45 bg-sage"
	},
	{
		kind: "signal",
		label: "Signals",
		query: "signals",
		swatch: "border border-bone bg-transparent"
	},
	{
		kind: "person",
		label: "People",
		query: "people",
		swatch: "bg-clay"
	}
];
function Home() {
	const graphRef = (0, import_react.useRef)(null);
	const searchRef = (0, import_react.useRef)(null);
	const [query, setQuery] = (0, import_react.useState)("");
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [frozen, setFrozen] = (0, import_react.useState)(false);
	const [phase, setPhase] = (0, import_react.useState)("live");
	const hits = (0, import_react.useMemo)(() => searchChart(query), [query]);
	const selected = selectedId ? NODE_BY_ID.get(selectedId) : void 0;
	const ties = selected ? tiesOf(selected.id) : [];
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			const target = event.target;
			const typing = target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
			if (event.key === "/" && !typing) {
				event.preventDefault();
				searchRef.current?.focus();
			} else if ((event.key === "f" || event.key === "F") && !typing) {
				event.preventDefault();
				graphRef.current?.fitAll();
			} else if (event.key === "Escape") {
				setSelectedId(null);
				if (typing && target instanceof HTMLElement) target.blur();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	const phaseLabel = phase === "live" ? "Live" : phase === "frozen" ? "Frozen" : "Settled";
	const countLabel = hits ? hits.nodes.size === 0 ? "No marks match" : `${hits.nodes.size} marks` : `${NODES.length} nodes · ${EDGES.length} edges`;
	const reheatLayout = () => {
		setFrozen(false);
		graphRef.current?.reheat();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-ink text-bone",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForceGraph, {
				ref: graphRef,
				query,
				selectedId,
				frozen,
				onSelect: setSelectedId,
				onPhase: setPhase
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "chart-vignette pointer-events-none absolute inset-0",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "absolute top-3 right-3 left-3 z-10 md:right-auto md:w-80",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-line bg-panel px-3 py-3 md:px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-widest text-brass uppercase",
								children: "North Atlantic"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-3xl leading-none text-bone",
								children: "Meridian"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-right text-xs text-mist tabular-nums",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mr-1.5 inline-block size-2 rounded-full align-middle " + (phase === "live" ? "bg-sage" : phase === "frozen" ? "bg-brass" : "bg-mist"),
									"aria-hidden": "true"
								}), phaseLabel]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 hidden text-sm text-mist md:block",
							children: "Listening posts, ships, and the sounds between them."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative mt-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
									className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mist",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "sr-only",
									htmlFor: "chart-search",
									children: "Search nodes and ties"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: searchRef,
									id: "chart-search",
									value: query,
									onChange: (event) => setQuery(event.target.value),
									onKeyDown: (event) => {
										if (event.key !== "Enter") return;
										event.preventDefault();
										if (hits && hits.nodes.size > 0) graphRef.current?.fitIds([...hits.nodes]);
										else graphRef.current?.fitAll();
									},
									placeholder: "Search nodes and ties",
									autoComplete: "off",
									autoCapitalize: "off",
									autoCorrect: "off",
									spellCheck: false,
									suppressHydrationWarning: true,
									className: "h-11 w-full rounded-full border border-line bg-ink pr-11 pl-10 text-base text-bone placeholder:text-mist focus-visible:border-brass focus-visible:outline-none"
								}),
								query ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "Clear search",
									onClick: () => {
										setQuery("");
										searchRef.current?.focus();
									},
									className: "absolute top-0 right-0 inline-flex size-11 items-center justify-center rounded-full text-mist hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
										className: "size-4",
										"aria-hidden": "true"
									})
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-mist tabular-nums",
							"aria-live": "polite",
							children: countLabel
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 flex flex-nowrap gap-2 overflow-x-auto",
							children: LEGEND.map((item) => {
								const pressed = query.trim().toLowerCase() === item.query;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										"aria-pressed": pressed,
										onClick: () => setQuery(pressed ? "" : item.query),
										className: "inline-flex h-11 items-center gap-2 rounded-full border px-3 text-sm transition-[background-color,border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass " + (pressed ? "border-brass bg-ink text-bone" : "border-line text-mist hover:border-mist"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "size-2.5 rounded-sm " + item.swatch,
											"aria-hidden": "true"
										}), item.label]
									})
								}, item.kind);
							})
						})
					]
				})
			}),
			selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				"aria-label": `${selected.label} details`,
				className: "inspector-scroll absolute right-3 bottom-24 left-3 z-20 overflow-y-auto rounded-2xl border border-line bg-panel p-4 md:bottom-3 md:left-auto md:w-80",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Close details",
						onClick: () => setSelectedId(null),
						className: "absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-full text-mist hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "size-4",
							"aria-hidden": "true"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-widest text-brass uppercase",
						children: KIND_LABEL[selected.kind]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display pr-10 text-2xl leading-tight text-bone",
						children: selected.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-mist",
						children: selected.blurb
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-normal text-bone",
						children: selected.notes
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-mist",
								children: "Ties"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "text-bone tabular-nums",
								children: DEGREE.get(selected.id) ?? 0
							}),
							selected.facts.map((fact) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "contents",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-mist",
									children: fact.k
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "text-bone",
									children: fact.v
								})]
							}, fact.k))
						]
					}),
					ties.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-medium text-bone",
							children: "Tied to"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1",
							children: ties.map(({ edge, other, outbound }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setSelectedId(other.id);
									graphRef.current?.focus(other.id);
								},
								className: "flex min-h-11 w-full items-baseline gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass",
								children: outbound ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-brass",
									children: edge.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-bone",
									children: other.label
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-bone",
									children: other.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-brass",
									children: edge.label
								})] })
							}) }, edge.id))
						})]
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute right-3 bottom-3 left-3 z-10 md:right-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-panel p-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: reheatLayout,
							className: "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brass px-3 text-sm font-medium text-ink transition-[background-color,scale] duration-150 ease-out hover:bg-brass/80 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Reheat"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": frozen,
							onClick: () => setFrozen((value) => !value),
							className: "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium transition-[background-color,border-color,scale] duration-150 ease-out active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass " + (frozen ? "border-brass bg-brass text-ink" : "border-line bg-ink text-bone hover:border-mist"),
							children: [frozen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								className: "size-4",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
								className: "size-4",
								"aria-hidden": "true"
							}), frozen ? "Resume" : "Freeze"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => graphRef.current?.fitAll(),
							className: "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-ink px-3 text-sm font-medium text-bone transition-[background-color,border-color,scale] duration-150 ease-out hover:border-mist active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crosshair, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Fit"]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { Home as component };
