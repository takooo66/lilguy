// lil guy Widget — 目だけ版
// Scriptable iOS widget
// tap → opens takooo66.github.io/lilguy/

const STATES = [
  { r:[0,4],   label:'still up', openRatio:0.15, pupRy:0.55, gray:152, glow:true  },
  { r:[4,12],  label:'zzz',      openRatio:0.02, pupRy:0.15, gray: 40, glow:false },
  { r:[12,16], label:'meh',      openRatio:0.40, pupRy:0.32, gray: 88, glow:false },
  { r:[16,21], label:'warming',  openRatio:0.65, pupRy:0.44, gray:128, glow:false },
  { r:[21,24], label:'peak',     openRatio:0.90, pupRy:0.58, gray:176, glow:true  },
]

function getState() {
  const h = new Date().getHours()
  return STATES.find(s => h >= s.r[0] && h < s.r[1]) || STATES[0]
}

function grayColor(g, alpha = 1) {
  const hex = g.toString(16).padStart(2, '0')
  return new Color(`#${hex}${hex}${hex}`, alpha)
}

function drawEye(ctx, cx, cy, ew, eh, state) {
  const { gray, openRatio, pupRy: pupRyRatio, glow } = state
  const openH = Math.max(eh * openRatio, 1)
  const pupRx = ew * 0.12
  const pupRy = Math.min(openH * 0.48, eh * pupRyRatio * 0.5)

  // glow rings
  if (glow) {
    for (let i = 3; i >= 1; i--) {
      ctx.setFillColor(grayColor(gray, 0.06 * i))
      const gr = new Path()
      gr.addEllipse(new Rect(cx - ew/2 - i*5, cy - openH/2 - i*5, ew + i*10, openH + i*10))
      ctx.addPath(gr)
      ctx.fillPath()
    }
  }

  // sclera fill
  const eyeRect = new Rect(cx - ew/2, cy - openH/2, ew, openH)
  const eyePath = new Path()
  eyePath.addEllipse(eyeRect)
  ctx.setFillColor(grayColor(gray))
  ctx.addPath(eyePath)
  ctx.fillPath()

  // sclera black stroke
  ctx.setStrokeColor(Color.black())
  ctx.setLineWidth(2.5)
  ctx.addPath(eyePath)
  ctx.strokePath()

  // iris (amber)
  if (openRatio > 0.05) {
    const irisR = Math.min(ew * 0.36, openH * 0.46)
    const irisPath = new Path()
    irisPath.addEllipse(new Rect(cx - irisR, cy - irisR, irisR*2, irisR*2))
    ctx.setFillColor(new Color('#c4892a'))
    ctx.addPath(irisPath)
    ctx.fillPath()
  }

  // pupil
  const pupPath = new Path()
  pupPath.addEllipse(new Rect(cx - pupRx, cy - pupRy, pupRx*2, pupRy*2))
  ctx.setFillColor(new Color('#060606'))
  ctx.addPath(pupPath)
  ctx.fillPath()

  // highlight
  if (openRatio > 0.1) {
    const hx = pupRx * 0.35
    const hy = pupRy * 0.3
    const hiPath = new Path()
    hiPath.addEllipse(new Rect(cx - pupRx*0.3 - hx/2, cy - pupRy*0.55 - hy/2, hx, hy))
    ctx.setFillColor(new Color('#ffffff', 0.55))
    ctx.addPath(hiPath)
    ctx.fillPath()
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

  const eyeW = 54, eyeH = 38
  const gap = 20
  const lx = cw/2 - gap/2 - eyeW/2
  const rx = cw/2 + gap/2 + eyeW/2
  const ey = ch/2

  drawEye(ctx, lx, ey, eyeW, eyeH, state)
  drawEye(ctx, rx, ey, eyeW, eyeH, state)

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
