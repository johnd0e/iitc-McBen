#!/usr/bin/env ruby

begin
    require 'fileutils'  
    require 'os'         # gem install os
    require 'inifile'    # gem install inifile
    require 'nokogiri'   # gem install nokogiri  # may require ruby-dev zlib1c-dev
end


class Firefox
    REQ_NAMESPACE="https://github.com/jonatkins/ingress-intel-total-conversion"

    attr_reader :scripts

    private_class_method :new

    def self.create()
        ff = new
        if ff.isInstalled? then
            ff.loadListOfScripts
            return ff
        end
    end

    def basepath
        if OS.windows? then
            return File.join(ENV['APPDATA'],'Mozilla','Firefox')
        end

        return File.expand_path('~/.mozilla/firefox')
    end

    def firefox_profile_path()
        file = IniFile.load(File.join(basepath,'profiles.ini'))
        return File.join(basepath,file['Profile0']['Path'])
    end

    def getGreaseMonkyConfigFilename()
        File.join(firefox_profile_path,'gm_scripts','config.xml')
    end

    def isInstalled?
        return (File.exist?(File.join(basepath,'profiles.ini')) && isGreaseMonkyInstalled?)
    end

    def isGreaseMonkyInstalled?
        return File.exist? getGreaseMonkyConfigFilename
    end

    def loadListOfScripts
        File.open(getGreaseMonkyConfigFilename()) { |f|
            xml_doc = Nokogiri::XML(f)
            @scripts = xml_doc.xpath("//Script").map { |script|
                next if script.attributes["namespace"].value != REQ_NAMESPACE
                {
                    name: script.attributes["name"].value,
                    filename: script.attributes["filename"].value,
                    basedir: script.attributes["basedir"].value
                }
            } .compact
        }
    end

    def updateScript(name,src)
        idx = @scripts.index {|x| x[:name]==name }
        return if not idx

        script = @scripts[idx]
        if script[:filename]!= File.basename(src) then
            p "script has different filename: #{script[:filename]} != #{File.basename(src)}"
            return
        end

        FileUtils.cp(src, File.join(firefox_profile_path,'gm_scripts',script[:basedir],script[:filename]))
    end
end

def getPluginName(filename)
    ma = /^\s*\/\/\s*@name\s+(.*)\s*$/.match File.read(filename)
    return (ma and ma[1])
end

def updateScript(filename, browser)
    name = getPluginName(filename)
    if name then
        browser.updateScript(name,filename)
    end
end



ff = Firefox.create()
raise "firefox+GreaseMonky not found" if ff.nil?

Dir["build/local/plugins/*.user.js"].each { |filename|
    updateScript(filename, ff)
}
updateScript("build/local/total-conversion-build.user.js", ff)

