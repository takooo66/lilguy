// lil guy Widget — 目だけ版
// Scriptable iOS widget
// tap → opens takooo66.github.io/lilguy/

// upH/loH match HTML values (out of 74 SVG units = full eye height)
const STATES = [
  { r:[0,4],   label:'still up', upH:18, loH:8,  pupRy:26, fill:'#bccabc', glow:true  },
  { r:[4,12],  label:'zzz',      upH:70, loH:0,  pupRy:7,  fill:'#181c18', glow:false },
  { r:[12,16], label:'meh',      upH:46, loH:18, pupRy:16, fill:'#58625a', glow:false },
  { r:[16,21], label:'warming',  upH:24, loH:10, pupRy:22, fill:'#899590', glow:false },
  { r:[21,24], label:'peak',     upH:14, loH:6,  pupRy:28, fill:'#c8d4ca', glow:true  },
]

// Geometry is taken 1:1 from index.html's SVG (viewBox 320x140).
// Eye spans y=28..102 (h=74), center y=70. Iris/pupil are fixed-size and
// centered; lids are black rects that mask them (same as the HTML).
const EYE_TOP = 28, EYE_BOT = 102, EYE_CY = 70
const EYES = [{ x0:20, x1:130, cx:75 }, { x0:190, x1:300, cx:245 }]
const IRIS_RX = 24, IRIS_RY = 21, PUP_RX = 5

function getState() {
  const h = new Date().getHours()
  return STATES.find(s => h >= s.r[0] && h < s.r[1]) || STATES[0]
}

function hexToColor(hex, alpha = 1) {
  return new Color(hex, alpha)
}

// map SVG coords → canvas coords
function makeT(scale, ox, oy) {
  return (x, y) => new Point(ox + x * scale, oy + y * scale)
}

// Almond: M x0 70 C x0+15 28, x1-15 28, x1 70 C x1-15 102, x0+15 102, x0 70 Z
function addAlmond(p, T, e, grow = 0, reverse = false) {
  const x0 = e.x0 - grow, x1 = e.x1 + grow
  const top = EYE_TOP - grow, bot = EYE_BOT + grow
  p.move(T(x0, EYE_CY))
  if (!reverse) {
    p.addCurve(T(x1, EYE_CY), T(x0 + 15, top), T(x1 - 15, top))
    p.addCurve(T(x0, EYE_CY), T(x1 - 15, bot), T(x0 + 15, bot))
  } else {
    p.addCurve(T(x1, EYE_CY), T(x0 + 15, bot), T(x1 - 15, bot))
    p.addCurve(T(x0, EYE_CY), T(x1 - 15, top), T(x0 + 15, top))
  }
  p.closeSubpath()
  return p
}

function almondPath(T, e, grow = 0) {
  return addAlmond(new Path(), T, e, grow)
}

function fillEllipse(ctx, T, scale, cx, cy, rx, ry, color) {
  const c = T(cx - rx, cy - ry)
  const p = new Path()
  p.addEllipse(new Rect(c.x, c.y, rx * 2 * scale, ry * 2 * scale))
  ctx.setFillColor(color)
  ctx.addPath(p)
  ctx.fillPath()
}

function fillSvgRect(ctx, T, scale, x, y, w, h, color) {
  const c = T(x, y)
  const p = new Path()
  p.addRect(new Rect(c.x, c.y, w * scale, h * scale))
  ctx.setFillColor(color)
  ctx.addPath(p)
  ctx.fillPath()
}

function drawEye(ctx, T, scale, e, state) {
  const upH = Math.min(state.upH, 74)
  const loH = Math.min(state.loH, 74 - upH)

  // --- sclera ---
  ctx.setFillColor(hexToColor(state.fill))
  ctx.addPath(almondPath(T, e))
  ctx.fillPath()

  // --- iris + pupil (fixed size, centered like the HTML) ---
  fillEllipse(ctx, T, scale, e.cx, EYE_CY, IRIS_RX, IRIS_RY, hexToColor('#588d5c'))
  fillEllipse(ctx, T, scale, e.cx, EYE_CY, PUP_RX, state.pupRy, Color.black())

  // --- lids ---
  if (upH > 0) fillSvgRect(ctx, T, scale, e.x0 - 2, EYE_TOP - 2, e.x1 - e.x0 + 4, upH + 2, Color.black())
  if (loH > 0) fillSvgRect(ctx, T, scale, e.x0 - 2, EYE_BOT - loH, e.x1 - e.x0 + 4, loH + 2, Color.black())

  // --- mask outside the almond (DrawContext has no clip) ---
  const x0 = e.x0, x1 = e.x1
  const top = new Path()
  top.move(T(x0 - 2, EYE_TOP - 30)); top.addLine(T(x0 - 2, EYE_CY)); top.addLine(T(x0, EYE_CY))
  top.addCurve(T(x1, EYE_CY), T(x0 + 15, EYE_TOP), T(x1 - 15, EYE_TOP))
  top.addLine(T(x1 + 2, EYE_CY)); top.addLine(T(x1 + 2, EYE_TOP - 30)); top.closeSubpath()
  const bot = new Path()
  bot.move(T(x0 - 2, EYE_BOT + 30)); bot.addLine(T(x0 - 2, EYE_CY)); bot.addLine(T(x0, EYE_CY))
  bot.addCurve(T(x1, EYE_CY), T(x0 + 15, EYE_BOT), T(x1 - 15, EYE_BOT))
  bot.addLine(T(x1 + 2, EYE_CY)); bot.addLine(T(x1 + 2, EYE_BOT + 30)); bot.closeSubpath()
  ctx.setFillColor(Color.black())
  ctx.addPath(top); ctx.fillPath()
  ctx.addPath(bot); ctx.fillPath()

  // --- sclera black stroke ---
  ctx.setStrokeColor(Color.black())
  ctx.setLineWidth(3.5 * scale)
  ctx.addPath(almondPath(T, e))
  ctx.strokePath()

  // --- glow: rings outside the almond (reverse-wound inner edge = hole) ---
  if (state.glow) {
    for (let i = 1; i <= 3; i++) {
      const ring = almondPath(T, e, 1.75 + i * 3)
      addAlmond(ring, T, e, 1.75, true)
      ctx.setFillColor(hexToColor('#588d5c', 0.12))
      ctx.addPath(ring)
      ctx.fillPath()
    }
  }
}

async function createWidget() {
  const w = new ListWidget()
  w.backgroundColor = Color.black()
  w.url = 'https://takooo66.github.io/lilguy/'
  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000)

  const state = getState()

  const cw = 155, ch = 155
  const ctx = new DrawContext()
  ctx.size = new Size(cw, ch)
  ctx.opaque = false
  ctx.respectScreenScale = true

  // fit SVG x=10..310 (eyes + glow margin) into the canvas width
  const scale = cw / 300
  const T = makeT(scale, -10 * scale, ch / 2 - EYE_CY * scale)
  for (const e of EYES) drawEye(ctx, T, scale, e, state)

  const img = ctx.getImage()
  const stack = w.addStack()
  stack.layoutVertically()
  stack.addSpacer()
  const imgEl = stack.addImage(img)
  imgEl.imageSize = new Size(cw, ch)
  stack.addSpacer()

  return w
}

const widget = await createWidget()

if (config.runsInWidget) {
  Script.setWidget(widget)
} else {
  await widget.presentSmall()
}

Script.complete()
