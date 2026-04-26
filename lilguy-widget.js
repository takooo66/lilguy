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

const SVG_H = 74  // HTML eye height reference

function getState() {
  const h = new Date().getHours()
  return STATES.find(s => h >= s.r[0] && h < s.r[1]) || STATES[0]
}

function hexToColor(hex, alpha = 1) {
  return new Color(hex, alpha)
}

function drawEye(ctx, cx, cy, ew, eh, state) {
  const upperLidH = (state.upH / SVG_H) * eh
  const lowerLidH = (state.loH / SVG_H) * eh
  const openH = Math.max(eh - upperLidH - lowerLidH, 0)

  // --- glow (behind everything, green-tinted) ---
  if (state.glow && openH > 2) {
    for (let i = 3; i >= 1; i--) {
      ctx.setFillColor(hexToColor('#588d5c', 0.07 * i))
      const gr = new Path()
      gr.addEllipse(new Rect(cx - ew/2 - i*5, cy - openH/2 - i*4, ew + i*10, openH + i*8))
      ctx.addPath(gr)
      ctx.fillPath()
    }
  }

  // --- sclera (full ellipse, lids will mask it) ---
  const scleraPath = new Path()
  scleraPath.addEllipse(new Rect(cx - ew/2, cy - eh/2, ew, eh))
  ctx.setFillColor(hexToColor(state.fill))
  ctx.addPath(scleraPath)
  ctx.fillPath()

  // --- iris (green, rx:ry ≈ 24:21, centered at cy) ---
  if (openH > 3) {
    // rx:ry = 24:21 ratio
    const irisRx = Math.min(ew * 0.33, openH * 0.56)
    const irisRy = irisRx * (21 / 24)
    const irisPath = new Path()
    irisPath.addEllipse(new Rect(cx - irisRx, cy - irisRy, irisRx*2, irisRy*2))
    ctx.setFillColor(hexToColor('#588d5c'))
    ctx.addPath(irisPath)
    ctx.fillPath()

    // pupil (vertical slit ellipse, scales with pupRy/28, clamped to irisRy)
    const pupRyScaled = (state.pupRy / 28) * irisRy * 1.30
    const pupRx = ew * 0.075
    const pupRy = Math.min(pupRyScaled, irisRy)

    if (pupRy > 0.5) {
      const pupPath = new Path()
      pupPath.addEllipse(new Rect(cx - pupRx, cy - pupRy, pupRx*2, pupRy*2))
      ctx.setFillColor(new Color('#000000'))
      ctx.addPath(pupPath)
      ctx.fillPath()

      // highlight
      const hx = pupRx * 0.38, hy = pupRy * 0.28
      const hiPath = new Path()
      hiPath.addEllipse(new Rect(cx - pupRx*0.3 - hx/2, cy - pupRy*0.6 - hy/2, hx, hy))
      ctx.setFillColor(new Color('#ffffff', 0.55))
      ctx.addPath(hiPath)
      ctx.fillPath()
    }
  }

  // --- upper lid (black rect from top, masks iris/pupil) ---
  if (upperLidH > 0) {
    const uLidPath = new Path()
    uLidPath.addRect(new Rect(cx - ew/2 - 2, cy - eh/2 - 1, ew + 4, upperLidH + 1))
    ctx.setFillColor(Color.black())
    ctx.addPath(uLidPath)
    ctx.fillPath()
  }

  // --- lower lid ---
  if (lowerLidH > 0) {
    const lLidPath = new Path()
    lLidPath.addRect(new Rect(cx - ew/2 - 2, cy + eh/2 - lowerLidH, ew + 4, lowerLidH + 1))
    ctx.setFillColor(Color.black())
    ctx.addPath(lLidPath)
    ctx.fillPath()
  }

  // --- sclera black stroke (on top of lids) ---
  ctx.setStrokeColor(Color.black())
  ctx.setLineWidth(3)
  ctx.addPath(scleraPath)
  ctx.strokePath()
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

  const eyeW = 56, eyeH = 36
  const gap = 18
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
