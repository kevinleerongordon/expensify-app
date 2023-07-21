import PropTypes from 'prop-types';

export default {
    /** Callback to fire when a file has been dragged into the text input & report body */
    onDragEnter: PropTypes.func.isRequired,

    /** Callback to fire when the user is no longer dragging over the text input & report body */
    onDragLeave: PropTypes.func.isRequired,

    /** Callback to fire when a file is dropped on the text input & report body */
    onDrop: PropTypes.func.isRequired,

    /** Id of the element on which we want to detect drag */
    dropZoneId: PropTypes.string.isRequired,

    /** Id of the element which is shown while drag is active */
    activeDropZoneId: PropTypes.string.isRequired,

    /** Whether drag & drop should be disabled */
    isDisabled: PropTypes.bool,

    /** Rendered child component */
    children: PropTypes.node.isRequired,
};
