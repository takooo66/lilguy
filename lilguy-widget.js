// lil guy Widget — 目だけ版
// Scriptable iOS widget
// tap → opens takooo66.github.io/lilguy/

const STATES = [
  { r:[0,4],   label:'still up', openRatio:0.15, pupRy:0.55, gray:200, glow:true  },
  { r:[4,12],  label:'zzz',      openRatio:0.02, pupRy:0.15, gray: 56, glow:false },
  { r:[12,16], label:'meh',      openRatio:0.40, pupRy:0.32, gray:126, glow:false },
  { r:[16,21], label:'warming',  openRatio:0.65, pupRy:0.44, gray:170, glow:false },
  { r:[21,24], label:'peak',     openRatio:0.90, pupRy:0.58, gray:228, glow:true  },
]

function getState() {
  const h = new Date().getHours()
  return STATES.find(s => h >= s.r[0] && h < s.r[1]) || STATES[0]
}

function rgba(r, g, b, a) {
  return new Color(`#${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}`, a)
}

function drawEye(ctx, cx, cy, ew, eh, state) {
  const gray = state.gray
  const openH = eh * state.openRatio
  const pupRx = ew * 0.12
  const pupRy = eh * state.pupRy * 0.5

  // glow rings for peak/still up
  if (state.glow) {
    for (let i = 3; i >= 1; i--) {
      const g = rgba(gray, gray, gray, 0.06 * i)
      ctx.setFillColor(g)
      const gr = new Path()
      gr.addEllipse(new Rect(cx - ew/2 - i*4, cy - openH/2 - i*4, ew + i*8, openH + i*8))
      ctx.addPath(gr)
      ctx.fillPath()
    }
  }

  // eye white/gray fill — ellipse approximation of almond shape
  ctx.setFillColor(rgba(gray, gray, gray, 1))
  const eye = new Path()
  eye.addEllipse(new Rect(cx - ew/2, cy - openH/2, ew, openH))
  ctx.addPath(eye)
  ctx.fillPath()

  // pupil
  const pupColor = Math.max(0, gray - 160)
  ctx.setFillColor(rgba(pupColor, pupColor, pupColor, 1))
  const pup = new Path()
  pup.addEllipse(new Rect(cx - pupRx, cy - pupRy, pupRx*2, pupRy*2))
  ctx.addPath(pup)
  ctx.fillPath()

  // pupil highlight
  if (state.openRatio > 0.1) {
    ctx.setFillColor(rgba(gray, gray, gray, 0.6))
    const hi = new Path()
    const hx = pupRx * 0.35
    const hy = pupRy * 0.3
    hi.addEllipse(new Rect(cx - pupRx*0.3 - hx/2, cy - pupRy*0.55 - hy/2, hx, hy))
    ctx.addPath(hi)
    ctx.fillPath()
  }
}

async function createWidget() {
  const w = new ListWidget()
  w.backgroundColor = Color.black()
  w.url = 'https://takooo66.github.io/lilguy/'
  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000)

  const state = getState()

  // canvas size: small widget ~155x155 points, draw at 2x for clarity
  const cw = 155, ch = 155
  const ctx = new DrawContext()
  ctx.size = new Size(cw, ch)
  ctx.opaque = false
  ctx.respectScreenScale = true

  // eyes layout
  const eyeW = 54, eyeH = 38
  const gap = 20
  const totalW = eyeW * 2 + gap
  const lx = cw/2 - gap/2 - eyeW/2
  const rx = cw/2 + gap/2 + eyeW/2
  const ey = ch/2

  drawEye(ctx, lx, ey, eyeW, eyeH, state)
  drawEye(ctx, rx, ey, eyeW, eyeH, state)

  // label
  const tf = new Font('Menlo', 10)
  ctx.setFont(tf)
  ctx.setTextColor(rgba(140, 140, 140, 1))
  ctx.drawText(state.label, new Point(cw/2 - 26, ey + eyeH/2 + 10))

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
