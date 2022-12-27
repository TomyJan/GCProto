@echo off


::协议文件路径, 最后不要跟“\”符号
set SOURCE_FOLDER=.\proto
::如果文件中引用了别的proto文件， IMP_ FOLDER是引用的proto文件的目录
set IMP_ FOLDER=
::Java编译器路径
set JAVA_COMPILER_PATH=.\bin\protoc.exe
::Java文件生成路径, 最后不要跟“\”符号
set JAVA_TARGET_PATH=.\proto_output


::删除之前创建的文件
del %JAVA_TARGET_PATH%\*.* /f /s /q


::遍历所有文件
for /f "delims=" %%i in ('dir /b "%SOURCE_FOLDER%\*.proto"') do (
    
    echo %JAVA_COMPILER_PATH% -I=%SOURCE_FOLDER%  --java_out=%JAVA_TARGET_PATH% %SOURCE_FOLDER%\%%i
    %JAVA_COMPILER_PATH% --proto_path=% IMP_ FOLDER%  --java_out=%JAVA_TARGET_PATH% %SOURCE_FOLDER%\%%i
    
)


echo 协议生成完毕。


pause

