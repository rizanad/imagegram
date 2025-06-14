"use client"; // is needed only if you’re using React Server Components
import { FileUploaderRegular } from "@uploadcare/react-uploader/next";
import "@uploadcare/react-uploader/core.css";

const FileUploader = () => {
  return (
    <div>
      <FileUploaderRegular
        sourceList="local, camera, facebook, gdrive"
        classNameUploader="uc-light"
        pubkey="25e9c4d476cfb9276528"
      />
    </div>
  );
};

export default FileUploader;
