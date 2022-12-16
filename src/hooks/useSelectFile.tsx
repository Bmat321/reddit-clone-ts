import React, { useState } from 'react';



const useSelectFile = () => {
    const [selectedFile, setSelectedFile] = useState<string>();

    const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const reader = new FileReader();
        if (event.target.files?.[0]) {
          reader.readAsDataURL(event.target.files[0]);
        }
    
        reader.onload = (eventReader) => {
          if (eventReader.target?.result) {
            setSelectedFile(eventReader.target.result as string);
          }
        };
      };
    
    return {
        onSelectFile,
        selectedFile,
        setSelectedFile
    }
}
export default useSelectFile;