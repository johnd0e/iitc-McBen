#!/usr/bin/env ruby
require 'webrick'




class ScriptList  < WEBrick::HTTPServlet::AbstractServlet
  def do_GET (request, response)
    response['Content-Type'] = 'text/HTML'
    response.status = 200
    response.body = generateHTML()
  end

  def generateHTML()
    '<!DOCTYPE html><html><head><style>'+
      css()+
    '</style></head><body>'+
      scriptList()+
    '</body>'
  end

  def scriptList()
    scripts = []
    Dir.chdir('build') {
      Dir['local/*.meta.js'].each { |f|
        s = readScript(f)
        s[:category] = "Main"
        scripts.push(s)
      }
      Dir['local/plugins/*.meta.js'].each { |f| scripts.push(readScript(f)) }
    }

    scripts = scripts.group_by { |g| g[:category] || "None"}
    scripts.delete("Deleted")

    text = ''
    scripts.each {|category, scripts|
      text += "<label class='collapse' for='#{category}'><h1>#{category}</h1></label>"
      text += "<input id='#{category}' type='checkbox' checked>"
      text += "<div>"
      text += scripts.map {|s| scriptBlockHTML(s)}.join()
      text += "</div>"
    }

    return text
  end

  def readScript(filename)
      inf =  File.read(filename)
      desc = inf.scan(/^\s*\/\/\s*@(\w+)\s+(.+)$/).to_h
      desc = desc.inject({}){|memo,(k,v)| memo[k.downcase.to_sym] = v; memo}
      desc[:filename] = filename.sub('.meta.', '.user.')

      return desc
  end


  def scriptBlockHTML(meta)
    name = meta[:name].empty? ? 'unknown' : meta[:name]
    desc = meta[:description].gsub(/^\[.*\]/,'')

    "<div class='script'>"+
      "<a href='#{meta[:filename]}'>#{name}</a> <span>#{meta[:version]}</span><br>"+
      "<div class='desc'>#{desc}</div>"+
    "</div>"
  end

  def css()
<<END_CSS
  body {
    font-family: arial;
  }
  h1 {
    border-bottom: 1px solid;
    font-size: 1.2em;
  }
  .desc {
    margin-left: 2em;
    background: #ececec;
  }
  .script {
    padding-bottom: 0.3em;
  }
  .script span {
   font-size: 0.8em;
  }
  .collapse{  cursor: pointer;  display: block;  background: #cdf;}
  .collapse + input{  display: none;}
  .collapse + input + div{  display:none;}
  .collapse + input:checked + div{  display:block;}
END_CSS
  end

end

#s = ScriptList.new({})
#s.scriptList()
#exit

server = WEBrick::HTTPServer.new :Port => 8100, :DocumentRoot => './build'
trap 'INT' do server.shutdown end
server.mount "/index", ScriptList
server.start

