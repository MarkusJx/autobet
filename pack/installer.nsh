!macro customUnInstall
    ${ifNot} ${isUpdated}
        RMDir /R "$DOCUMENTS\autobet"
        RMDir /R "$APPDATA\..\Local\autobet-updater"
        RMDir /R "$APPDATA\autobet"
    ${endIf}
!macroend