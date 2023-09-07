// Removed useless files, to speed up build process and make it clearer.
const path = require("path");
const fs = require("fs");
const readline = require("readline");

// cmdid current version
const read_cmdid_last = "cmdid_last.csv";
const read_cmdid = "cmdid.csv";
const read_cmdid_output = "cmdid.json";
const read_cmdid_ht_output = "cmdid_ht_40.json";
const read_cmdid_output_gc = "cmdid_gc.json";
const read_cmdid_output_gc_update = "cmdid_gc_update.json";
const read_cmdid_output_gc_nofound = "cmdid_gc_nofound.json";

const file_gc_needed = "gc_needed.json";
const file_gc_needed2 = "gc_needed2.json";

const write_op = "PacketOpcodes.java";

console.log(process.cwd());

//(TODO: add input file)
// folder gc auto-generated proto
const folder_proto_gc_gen =
  "../GSServer-GC/src/generated/main/java/emu/grasscutter/net/proto/";

// file PacketOpcodes currently in use
const read_cmdid_gc =
  "../GSServer-GC/src/main/java/emu/grasscutter/net/packet/PacketOpcodes.java";

const folder_packet_gc =
  "../GSServer-GC/src/main/java/emu/grasscutter/server/packet/";

const folder_gc_scan = "../GSServer-GCOriginal/src/main/java/emu/grasscutter/";

//const read_cmdid = fs.readFileSync("cmdid.csv");
//const read_packetopcodes = fs.readFileSync("PacketOpcodes.java");

var data = [];
var data_gc = [];

var index_file_gen = 0;
var index_file_cmdid = 0;
var index_cmdid_gc = 0;
var index_cmdid_gc_out = 0;
function check_gen() {
  fs.readdir(folder_proto_gc_gen, function (err, files) {
    //handling error
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    files.forEach(function (file) {
      index_file_gen++;
    });
    console.log("file proto gen: " + index_file_gen);
  });
}

// gen json file cmdid
function get_cmdid_json() {
  const inputStreamcmdid = fs.createReadStream(read_cmdid);
  var lineReadercmdid = readline.createInterface({
    input: inputStreamcmdid,
    terminal: false,
  });
  lineReadercmdid.on("line", function (line) {
    var config = line.split(",");
    var subdata = new Object();
    subdata["name"] = config[0];
    subdata["id"] = parseInt(config[1]);
    data.push(subdata);
    index_file_cmdid++;
  });
  lineReadercmdid.on("close", function () {
    console.log("found cmd id " + index_file_cmdid);
    save_json(data, read_cmdid_output);
  });
}

var data_gen = [];
var index_file_cmdid_gen = 0;
// gen json file cmdid
function read_cmdid_ht_json() {
  const k = read_json(read_cmdid_ht_output);
  // console.log(k);
  for (const key in k) {
    var name = k[key];
    var id = parseInt(key);
    //console.log(id);
    var subdata = new Object();
    subdata["name"] = name;
    subdata["id"] = id;
    data_gen.push(subdata);
    index_file_cmdid_gen++;
  }

  console.log("found cmd id " + index_file_cmdid_gen);
  save_json(data_gen, read_cmdid_output);
}

// create cmdid from gc which comes from PacketOpcodes
function get_cmdid_gc() {
  const inputStreamcmdid = fs.createReadStream(read_cmdid_gc);
  var lineReadercmdid = readline.createInterface({
    input: inputStreamcmdid,
    terminal: false,
  });
  lineReadercmdid.on("line", function (line) {
    var config = line.split(" = ");
    var name = config[0];
    var id = parseInt(config[1]);
    if (name.includes("public static final int")) {
      name = name.replace("\tpublic static final int ", "");
      // skip 0 ?
      if (id == 0) {
        return;
      }
      var subdata = new Object();
      subdata["name"] = name;
      subdata["id"] = id;
      data_gc.push(subdata);
      //console.log(name);
      index_cmdid_gc++;
    } else {
      index_cmdid_gc_out++;
    }
  });
  lineReadercmdid.on("close", function () {
    console.log(
      "found cmd id " + index_cmdid_gc + " | no need " + index_cmdid_gc_out
    );
    save_json(data_gc, read_cmdid_output_gc);
  });
}

var found_cmdid_new = 0;
var nofound_cmdid_new = 0;
var rename_name_cmdid = 0;
var noneed_rename_name_cmdid = 0;
var data_gc_cmdid_nofound = [];

var check_dunp_id = [];
function update_cmdid_gc() {
  let melon = "";
  // cmdid_gc.json (read_cmdid_output_gc) and cmdid.json (read_cmdid_output)

  const json_cmdid_last = read_json(read_cmdid_output);
  const json_cmdid_old = read_json(read_cmdid_output_gc);

  json_cmdid_old.forEach(function (s, index) {
    var id = s.id;
    var name = s.name.trim();

    // switch to name mode?
    var found_id = json_cmdid_last.find((j) => j.name == name);
    if (found_id) {
      found_cmdid_new++;

      if (id == found_id.id) {
        noneed_rename_name_cmdid++;
      } else {
        rename_name_cmdid++;
        //console.log("Wow rename -> ID: "+id+" > "+found_id.id);

        s.replace = s.id; // old

        s.id = found_id.id; // rename id
      }
    } else {
      console.log("Wow nofound -> ID: " + id + " | Name: " + name);
      data_gc_cmdid_nofound.push(s);
      nofound_cmdid_new++;
    }

    melon += `${name},${id}\n`;

    // find dump by id
    /*
    var found_id = check_dunp_id.find((j) => j.id == id);
    if (found_id) {

      console.log("Wow dup -> ID: " +id +" (ADD " +found_id.id +") | Name Remove: " +name +" (ADD " +found_id.name +")");
      // remove bad
      json_cmdid_old.splice(index, 1);

    } else {

      check_dunp_id.push(s);
    }
    */

    // find dump by name?
  });

  check_dunp_id = []; // clear

  // I don't know why this happened but make sure to check again
  /*
  var check_dunp_name = [];
  json_cmdid_old.forEach(function (s, index) {
    var id = s.id;
    var name = s.name.trim();

    var found_name = check_dunp_name.find((j) => j.name === name);
    if (found_name) {
      console.log(
        "Wow dup -> ID: " +
          id +
          " (ADD " +
          found_name.id +
          ") | Name Remove: " +
          name +
          " (ADD " +
          found_name.name +
          ")"
      );
      // remove bad
      json_cmdid_old.splice(index, 1);
    } else {
      check_dunp_name.push(s);
    }

    var found_id = json_cmdid_last.find((j) => j.id == id);
    if (found_id) {
      if (name != found_id.name) {
        console.log(
          "Wow why? -> ID: " + id + " | Name: " + name + " > " + found_id.name
        );
        s.name = found_id.name;
      }
    }
  });
*/
  //check_dunp_name = []; // clear

  console.log(
    "found " +
      found_cmdid_new +
      " | no found " +
      nofound_cmdid_new +
      " | rename " +
      rename_name_cmdid +
      " | noneed rename " +
      noneed_rename_name_cmdid
  );

 // const csvRows = Object.entries(read_cmdid_output_gc_update).map(([name, id]) => `${name},${id}`);



//  const csvData = csvRows.join("\n");

  fs.writeFileSync(read_cmdid_last, melon);

  save_json(json_cmdid_old, read_cmdid_output_gc_update);
  save_json(data_gc_cmdid_nofound, read_cmdid_output_gc_nofound);
}

function read_json(file) {
  return JSON.parse(fs.readFileSync(file));
}

// save json
function save_json(raw, file) {
  var j = JSON.stringify(raw, null, 4);
  save(j, file);
}

function save(raw, file) {
  fs.writeFile(file, raw, "utf8", function (err) {
    if (err) {
      console.log("An error occured while writing to File.");
      return console.log(err);
    }
    console.log("File has been saved: " + file);
  });
}

var dup_name = [];
var count_dup = 0;
var count_nodup = 0;
function cmdid_to_op() {
  let melon =
    "\
    package emu.grasscutter.net.packet;\
    \n\
    \npublic class PacketOpcodes {\
        \n// Empty\
        \npublic static final int NONE = 0;\
        \n\
        \n// Opcodes\
    ";

  //const read_file_gcneed = fs.readFileSync(file_gc_needed2);
  //const json_gcneed_raw = JSON.parse(read_file_gcneed);

  const cmdidfix_raw = fs.readFileSync(read_cmdid_output_gc_update);
  const json_cmdidfix_raw = JSON.parse(cmdidfix_raw);

  //const json_cmdidfix_raw = read_json(read_cmdid_output_gc_update);

  json_cmdidfix_raw.forEach(function (s) {
    var found_id = dup_name.find((j) => j.name == s.name);
    if (!found_id) {
      melon += "\npublic static final int " + s.name + " = " + s.id + ";";
      dup_name.push(s);
      count_nodup++;
    } else {
      count_dup++;
      if (s.replace) {
        console.log("DUP: " + found_id.id + " > " + s.id + " ");
      }
    }
    //console.log(s);
    /*
    var found_new = json_cmdidfix_raw.find((j) => j.name == s.name);
    if(found_new){     
    }
    */
  });

  console.log("done no dup " + count_nodup + " | dup " + count_dup);

  melon += "\n}";
  save(melon, write_op); // use "npx prettier --write PacketOpcodes.java" for better Formatter
}

var index_file_packet = 0;
var index_file_packet_found = 0;
var index_file_packet_nofound = 0;
var index_file_packet_rename = 0;
var index_file_packet_norename = 0;
var index_file_packet_renamemulti = 0;
var file_gc_need = [];
function fix_packet(saveit = false) {
  const files = getAllFiles(folder_packet_gc);

  const json_cmdid_last = read_json(read_cmdid_output);
  const json_cmdid_old = read_json(read_cmdid_output_gc);
  const json_cmdidfix_raw = read_json(read_cmdid_output_gc_update);

  files.forEach(function (file) {
    //var f = path + "/" + file;
    const read = fs.readFileSync(file);
    var real = read.toString();

    var name = getPacketOpcodes(real);
    if (!name) {
      console.log("no found");
      return;
    }

    if (name === "NONE") {
      return;
    }

    var subdata = new Object();
    subdata["name"] = name;
    file_gc_need.push(subdata);

    //var name = c[1];

    //console.log(r);

    var found_old = json_cmdid_old.find((j) => j.name === name);
    if (found_old) {
      //console.log(found_old);
      index_file_packet_found++;
      var found_new = json_cmdid_last.find((j) => j.id == found_old.id);
      if (found_new) {
        if (found_new.name != found_old.name) {
          index_file_packet_rename++;
          console.log(
            "Found need rename: " + found_old.name + " > " + found_new.name
          );

          // rename all
          json_cmdidfix_raw.forEach(function (s) {
            var r = s.replace;
            if (r) {
              // var notify = HomeNewUnlockedBgmIdListNotify.Unk2700_MEBFPBDNPGO_ServerNotify
              // var notify = Unk2700MEBFPBDNPGOServerNotify.HomeNewUnlockedBgmIdListNotify

              // Unk2700MEBFPBDNPGOServerNotify to HomeNewUnlockedBgmIdListNotifyOuterClass
              // Unk2700OGHMHELMBNNServerRsp to  HomeChangeBgmRspOuterClass

              // - Need More Auto like -
              // addUnk2700ELJPLMIHNIP to addNewUnlockedBgmIdList (this should be found inside gen proto)
              // setUnk2700BJHAMKKECEI to setBgmId
              if (r.match("Unk")) {
                //console.log(r);
                var x = r.split("_");
                var tr = x.join("");
                var realneed = tr;

                if (tr.match("ServerNotify")) {
                  //console.log("found: "+tr);
                  let re = new RegExp(`${tr}`, "g");
                  tr = tr.replace(re, `${s.name}OuterClass`);
                  //console.log("found: " + tr);
                } else if (tr.match("ServerRsp")) {
                  let re = new RegExp(`${tr}`, "g");
                  tr = tr.replace(re, `${s.name}OuterClass`);
                } else {
                  let re = new RegExp(`${tr}`, "g");
                  tr = tr.replace(re, s.name);
                  //console.log("found: " + tr);
                }
                let re = new RegExp(`${realneed}`, "g");
                real = real.replace(re, tr);
              }
              let re = new RegExp(`${r}`, "g");
              real = real.replace(re, s.name);
            }
          });

          // simpel rename
          //let re = new RegExp(`${found_old.name}`, "g");
          //real = real.replace(re, found_new.name);

          //console.log(real);
          if (saveit) {
            save(real, f);
          }
        }
      } else {
        index_file_packet_norename++;
        //console.log("Same name "+name);
      }
    } else {
      index_file_packet_nofound++;
      console.log("No found " + name);
    }

    //return;
    index_file_packet++;
  });
  save_json(file_gc_need, file_gc_needed); // This only applies to PacketOpcodes
  console.log(
    "Index file: " +
      index_file_packet +
      " | found " +
      index_file_packet_found +
      " | No found " +
      index_file_packet_nofound +
      " | Rename " +
      index_file_packet_rename +
      " | NoRename " +
      index_file_packet_norename
  );
}

function isBlank(str) {
  return !!!str || /^\s*$/.test(str);
}

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

function getPacketOpcodes(raw) {
  var r = raw.match(/\(.*?\)/g).map((x) => x.replace(/[()]/g, ""));
  var name;
  r.forEach(function (s, index) {
    if (s.match("PacketOpcodes.")) {
      name = s.split("PacketOpcodes.")[1];
      if (name.match(",")) {
        name = name.split(",")[0];
      }
      return;
    }
  });
  return name;
}

// C:\Users\Administrator\Desktop\Projek\Docker\GS\gs\GSServer-GC\src\main\java\emu\grasscutter

var file_proto = [];
var file_proto_more = [];

var found_noclean = 0;
var found_needclean = 0;
var found_maybe_related = 0;

const regex_import = /\import "(.*?)\.proto"/g;

// find import in file
function find_import(file) {
  var torequire = [];

  var dir = path.parse(file).dir;

  if (file.match("ModifierDurability")) {
    //console.log("fff");
  }

  var rd;

  // read file
  try {
    const read = fs.readFileSync(file);
    rd = read.toString();
  } catch (error) {
    return;
  }

  while ((m = regex_import.exec(rd)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex_import.lastIndex) {
      regex_import.lastIndex++;
    }
    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      // only index 1 grup
      if (groupIndex == 1) {
        var found_rt = torequire.find((j) => j === match);
        if (found_rt) {
          //console.log(`Skip ${match}`);
        } else {
          if (match.match("Unk")) {
            //console.log(file + " require " + match);
          }
          //var subdata = new Object();
          //subdata["name"] = match;
          var sub = find_import(dir + "/" + match + ".proto");
          if (sub) {
            sub.forEach(function (k) {
              var v = torequire.find((j) => j === k);
              if (!v) {
                torequire.push(k);
              }
            });
          }
          torequire.push(match);
        }
      }
    });
  }
  return torequire;
}

function clean_proto_gen() {
  //const files = getAllFiles(folder_proto_gc_gen);
  const files = getAllFiles("./proto");

  const json_gc_needed = read_json(file_gc_needed);
  const json_gc_needed2 = read_json(file_gc_needed2);

  const json_gc_now = read_json(read_cmdid_output_gc);
  const json_gc_update = read_json(read_cmdid_output_gc_update);

  //AbilityInvokeArgument
  console.log(
    "File proto: " + files.length + " | Need " + json_gc_needed.length
  );

  // find all file import
  files.forEach(function (file) {
    var name_file = path.parse(file).name;

    var toaddfile = new Object();
    toaddfile["file"] = name_file;
    toaddfile["import"] = find_import(file);

    file_proto.push(toaddfile);
  });

  //console.log(file_proto);

  function find_json_proto(name_file, newnew = null) {
    var noe = [];
    if (newnew) {
      noe = newnew;
    }

    var found_proto = file_proto.find((j) => name_file === j.file); // must same file
    if (found_proto) {
      // if found import
      if (found_proto.import) {
        found_proto.import.forEach(function (s) {
          var f = noe.find((j) => j === s);
          if (!f) {
            noe.push(s);
            // check sub
            var sub = find_json_proto(s, noe);
            sub.forEach(function (k) {
              var v = noe.find((j) => j === k);
              if (!v) {
                noe.push(k);
              }
            });
          }
        });
      }
      var ss = noe.find((j) => j === name_file);
      if (!ss) {
        noe.push(name_file);
      }
    } else {
      // skip
    }
    return noe;
  }

  //console.log(find_json_proto("ActivityInfo"));

  // try with proto json
  var filedonotdelete = [];
  files.forEach(function (file) {
    var name_file = path.parse(file).name;

    var findme = false;

    // find main file
    var found = json_gc_needed.find((j) => name_file.match(j.name));
    if (found) {
      findme = true;
    } else {
      // skip
    }

    // find miss scan
    var found2 = json_gc_needed2.find((j) => name_file.match(j.name));
    if (found2) {
      findme = true;
    } else {
      // skip
    }

    // ModifierDurability >AbilityAppliedModifier -> AbilitySyncStateInfo -> AvatarEnterSceneInfo and multi file

    // main file
    if (findme) {
      var tosub = find_json_proto(name_file);
      tosub.forEach(function (k) {
        var oo = filedonotdelete.find((j) => j === k);
        if (!oo) {
          filedonotdelete.push(k);
        }
      });
    } else {
      // not main file
      /*
      if (name_file.match("ModifierDurability")) {
        console.log("3");
      }
      */
      if (file.match("ChannelerSlabChallenge")) {
        console.log(file);
      }
    }
  });

  // ModifierDurability
  //console.log(filedonotdelete);

  // last
  files.forEach(function (file) {
    var name_file = path.parse(file).name;
    var toskip = filedonotdelete.find((j) => name_file === j);
    if (toskip) {
      found_noclean++;
    } else {
      found_needclean++;
      // ActivityInfo
      if (file.match("ChannelerSlabChallenge")) {
        console.log("ChannelerSlabChallenge");
      }
      //console.log(name_file);
      //console.log("Remove file: " + file);
      try {
        fs.unlinkSync(file);
        //file removed
      } catch (err) {
        console.error(err);
      }
    }
  });

  //console.log(filedonotdelete);

  console.log(
    "No clean: " +
      found_noclean +
      " | Need to clean: " +
      found_needclean +
      " | Related " +
      found_maybe_related
  );
}

function clean_proto_gen_v2() {
  const files = getAllFiles("./proto");

  console.log("File proto: " + files.length);

  // find all file import
  files.forEach(function (file) {
    // Get the file name from the file path
    const fileName = path.basename(file);

    // Use regular expressions to extract the desired part
    const match = fileName.match(/^(.*)\.proto$/);
    if (match == null) {
      return;
    }
    const messageName = match[1];

    // Check if the string is all uppercase
    if (messageName === messageName.toUpperCase()) {
      console.log("Remove: " + file);
      try {
        fs.unlinkSync(file);
        //file removed
      } catch (err) {
        console.error(err);
      }
    } else {
      // console.log("String contains non-uppercase letters");
    }
  });
}

var g_todump = [];
function scan_gc() {
  const files = getAllFiles(folder_gc_scan);

  console.log("index file: " + files.length);

  const regex = /import emu.grasscutter.net.proto.(.*?);/g;

  files.forEach(function (file) {
    // read file
    const read = fs.readFileSync(file);
    var rd = read.toString();
    // find import
    while ((m = regex.exec(rd)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        // only index 1 grup
        if (groupIndex == 1) {
          if (match === "*") {
            return;
          }
          if (match.match(".")) {
            match = match.split(".")[0];
          }
          match = match.replace("OuterClass", "");
          var found_rt = g_todump.find((j) => j.name === match);
          if (found_rt) {
            //found_maybe_related++;
            //console.log(`Skip ${match}`);
          } else {
            var subdata = new Object();
            subdata["name"] = match;
            g_todump.push(subdata);
          }
        }
      });
    }
  });

  save_json(g_todump, file_gc_needed2); // This only applies to PacketOpcodes

  //console.log(g_todump);
}

function clean_proto_event() {
  var torequire = [
    "ActivityPushTipsData",
    "ActivityWatcherInfo",
    "MusicGameActivityDetailInfo",
  ];

  var filedonotdelete = [];

  let dir = "./proto";
  let file = "./proto/ActivityInfo.proto";

  var rd;

  const files = getAllFiles(dir);

  // read file
  try {
    const read = fs.readFileSync(file);
    rd = read.toString();
  } catch (error) {
    console.log(error);
    return;
  }

  //console.log(rd);

  while ((m = regex_import.exec(rd)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex_import.lastIndex) {
      regex_import.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      // only index 1 grup
      if (groupIndex == 1) {
        //console.log(`t: ${match}`);

        var found_rt = torequire.find((j) => j === match);
        if (found_rt) {
          //console.log(`Skip ${match}`);
        } else {
          //console.log(`add ${match}`);
          var sub = find_import(dir + "/" + match + ".proto");
          //console.log(sub);
          if (sub) {
            sub.forEach(function (k) {
              var v = torequire.find((j) => j === k);
              if (!v) {
                torequire.push(k);
              }
            });
          }
          filedonotdelete.push(match);
          torequire.push(match);
        }
      }
    });
  }

  // last
  files.forEach(function (file) {
    var name_file = path.parse(file).name;
    var toskip = filedonotdelete.find((j) => name_file === j);
    if (toskip) {
      found_needclean++;
      //console.log(name_file);
      try {
        fs.unlinkSync(file);
        console.log("Remove file: " + file);
        //file removed
      } catch (err) {
        //console.error(err);
      }
    } else {
      found_noclean++;
    }
  });

  console.log(
    "No clean: " +
      found_noclean +
      " | Need to clean: " +
      found_needclean +
      " | Related " +
      found_maybe_related
  );
}

function clean_proto_event_v2() {
  var torequire = [
    "ParamList",
    "StrengthenPointData",
    "TowerLevelEndNotify",
    "TrialAvatarFirstPassDungeonNotify",
  ];

  var filedonotdelete = [];

  let dir = "./proto";
  let file = "./proto/DungeonSettleNotify.proto";

  var rd;

  const files = getAllFiles(dir);

  // read file
  try {
    const read = fs.readFileSync(file);
    rd = read.toString();
  } catch (error) {
    console.log(error);
    return;
  }

  //console.log(rd);

  while ((m = regex_import.exec(rd)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex_import.lastIndex) {
      regex_import.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      // only index 1 grup
      if (groupIndex == 1) {
        //console.log(`t: ${match}`);

        var found_rt = torequire.find((j) => j === match);
        if (found_rt) {
          //console.log(`Skip ${match}`);
        } else {
          //console.log(`add ${match}`);
          var sub = find_import(dir + "/" + match + ".proto");
          //console.log(sub);
          if (sub) {
            sub.forEach(function (k) {
              var v = torequire.find((j) => j === k);
              if (!v) {
                torequire.push(k);
              }
            });
          }
          filedonotdelete.push(match);
          torequire.push(match);
        }
      }
    });
  }

  console.log(filedonotdelete);

  // last
  files.forEach(function (file) {
    var name_file = path.parse(file).name;
    var toskip = filedonotdelete.find((j) => name_file === j);
    if (toskip) {
      found_needclean++;
      console.log(name_file);
      try {
        fs.unlinkSync(file);
        console.log("Remove file: " + file);
        //file removed
      } catch (err) {
        //console.error(err);
      }
    } else {
      found_noclean++;
      //console.log("skip "+name_file);
    }
  });

  console.log(
    "No clean: " +
      found_noclean +
      " | Need to clean: " +
      found_needclean +
      " | Related " +
      found_maybe_related
  );
}

function cmdid_json_to_csv() {
  // read_cmdid_last
  const k = read_json(read_cmdid_ht_output);
  //console.log(k);

  const csvHeaders = "ID,Name\n";

  const csvRows = Object.entries(k).map(([name, id]) => `${id},${name}`);

  const csvData = csvRows.join("\n");

  fs.writeFileSync(read_cmdid_last, csvData);

  console.log("CSV file written successfully");
}

// cmdid_json_to_csv();
// Update GC Proto
// get_cmdid_gc(); // 1. get cmd old gc
//read_cmdid_ht_json(); // 2 or
// get_cmdid_json();  // 2. get last cmdid.csv to json
// now we have cmdid_gc.json and cmdid.json
// update_cmdid_gc(); // 3. update gc cmdid (mode by id)
// cmdid_to_op(); // 4. update op
// npx prettier --write PacketOpcodes.java
// scan_gc(); // 5. scan gc
// clean_proto_event(); // 6. clean event, need manual
// clean_proto_gen(); // 6. clean proto
// clean_proto_gen_v2();

// TODO: clean DungeonSettleNotify
// clean_proto_event_v2();
