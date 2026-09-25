// Resolve the live capture route, not the desktop default (which may differ).
function isVoxtype(node) {
  if (!node || !node.isStream || node.isSink) return false
  var name = String(node.name || "").replace(/^alsa_capture\./, "")
  if (name.indexOf("voxtype-audio-bridge") === 0) return false
  if (/^voxtype($|-)/.test(name)) return true
  if (!node.ready) return false
  var binary = String((node.properties || {})["application.process.binary"] || "")
  return /^voxtype($|-)/.test(binary) && binary.indexOf("voxtype-audio-bridge") !== 0
}

function inspect(nodes, links) {
  var streams = nodes.filter(isVoxtype)
  if (!streams.length) return "pending"
  var sources = []
  for (var i = 0; i < streams.length; i++) {
    var stream = streams[i]
    if (!stream.ready || !stream.audio) return "pending"
    if (stream.audio.muted) return "muted"
    var connected = false
    for (var j = 0; j < links.length; j++) {
      var link = links[j]
      if (link.target === stream && link.source && link.source.audio) {
        connected = true
        sources.push(link.source)
      }
    }
    if (!connected) return "pending"
  }
  for (var k = 0; k < sources.length; k++) {
    if (!sources[k].ready) return "pending"
    if (sources[k].audio.muted) return "muted"
  }
  return "ready"
}
