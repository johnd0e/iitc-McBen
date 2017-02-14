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

    def self.create(profile=nil)
        ff = Firefox.new
        if ff.isInstalled? then
            return ff
        end
    end

    def initialize()
        @firefox_profile_path = File.join(basepath, getProfilePath())
    end

    def selectProfile(name)
        @use_profile = name
        @firefox_profile_path = File.join(basepath, getProfilePath())
        loadListOfScripts()
    end

    def basepath
        if OS.windows? then
            return File.join(ENV['APPDATA'],'Mozilla','Firefox')
        end

        return File.expand_path('~/.mozilla/firefox')
    end

    private
    def getProfilePath()
        inifile = IniFile.load(File.join(basepath,'profiles.ini'))

        if @use_profile && not(inifile[@use_profile].empty?) then
            return inifile[@use_profile]['Path']
        end

        profile_name = findProfile(inifile, @use_profile)

        return (inifile[profile_name] && inifile[profile_name]['Path'])
    end

    private
    def findProfile(inifile, name)
        name = name || 'default'
        inifile.each_section {|section|
            return section if inifile[section]['Name']==name
        }
    end

    public
    def getListOfProfiles()
        file = IniFile.load(File.join(basepath,'profiles.ini'))
        profiles=[]
        file.each_section {|section|
            profiles.push( file[section]['Name'] ) unless file[section]['Name'].nil?
        }

        return profiles
    end

    def getGreaseMonkyConfigFilename()
        File.join(@firefox_profile_path,'gm_scripts','config.xml')
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

        FileUtils.cp(src, File.join(@firefox_profile_path,'gm_scripts',script[:basedir],script[:filename]))
    end
end



def main()
    ff = Firefox.create("dev-edition-default")
    raise "firefox not found" if ff.nil?

    profiles = getProfiles(ff)
    raise "GreaseMonky not found" if profiles.empty?

    profiles.each {|pro|
        puts "Profile: #{pro}" if profiles.size>1
        ff.selectProfile(pro)

        Dir["build/local/plugins/*.user.js"].each { |filename|
            updateScript(filename, ff)
        }
        updateScript("build/local/total-conversion-build.user.js", ff)
    }
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


def getProfiles(ff)
    profiles = ff.getListOfProfiles()
    profiles.delete_if {|pro|
        ff.selectProfile(pro)
        !ff.isGreaseMonkyInstalled?
    }
    return profiles
end


main()
