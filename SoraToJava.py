import os 

for file in os.listdir(r'./proto'):
    with open(f'./proto/{file}', 'r') as f:
        temp = '// Proto has been converted from Sorapointa to Grasscutter format\n'
        for line in f.readlines():
            if 'org.sorapointa.proto' in line:
                temp += "option java_package = \"emu.grasscutter.net.proto\";\n"
            else:
                temp += line
                
    with open(f'./proto/{file}', 'w') as out:
        out.write(temp)