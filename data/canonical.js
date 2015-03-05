// Content Script looking for a possible canonical URL of the page

let link = document.querySelector("link[rel='canonical']");

if(link)
    self.port.emit("done", link.href);
else
    self.port.emit("done", false);

