import React from "react";
import PropTypes from "prop-types";

const SkeletonLoaderTable = ({ colSpan }) => {
  return (
    <tr>
      {Array.from({ length: colSpan }, (_, index) => (
        <td key={index} className="text-center w-fit">
          <div className="flex justify-start">
            <div className="space-y-6 py-1">
              <div className="h-2 w-10 skeleton rounded animate-smooth-fade"></div>
            </div>
          </div>
        </td>
      ))}
    </tr>
  );
};

SkeletonLoaderTable.propTypes = {
  colSpan: PropTypes.number.isRequired,
};

export default SkeletonLoaderTable;
