import React from "react"; // Import React
import ReactDOM from "react-dom/client"; // Import createRoot from react-dom/client
import {
  Notification,
  useToaster,
  ButtonToolbar,
  SelectPicker,
  Button,
} from "rsuite"; // Import necessary components from rsuite

export const ToastifyCustom = () => {
  const [type, setType] = React.useState("info"); // State for notification type
  const [placement, setPlacement] = React.useState("topStart"); // State for notification placement
  const toaster = useToaster(); // Initialize the toaster

  // Message content of the notification
  const message = (
    <Notification type={type} header={`${type}!`} closable>
      <p>You have a {type} message, please check it.</p>
      <hr />
      <ButtonToolbar>
        <Button appearance="primary">Ok</Button>
        <Button appearance="default">Cancel</Button>
      </ButtonToolbar>
    </Notification>
  );

  return (
    <div>
      {message} {/* Display the message */}
      <hr />
      <ButtonToolbar>
        <SelectPicker
          value={type} // Selected value for notification type
          data={[
            { label: "info", value: "info" },
            { label: "success", value: "success" },
            { label: "warning", value: "warning" },
            { label: "error", value: "error" },
          ]}
          onChange={setType} // Update state on change
          style={{ width: 200 }}
        />
        <SelectPicker
          value={placement} // Selected value for placement
          data={[
            { label: "topStart", value: "topStart" },
            { label: "topCenter", value: "topCenter" },
            { label: "topEnd", value: "topEnd" },
            { label: "bottomStart", value: "bottomStart" },
            { label: "bottomCenter", value: "bottomCenter" },
            { label: "bottomEnd", value: "bottomEnd" },
          ]}
          onChange={setPlacement} // Update state on change
          style={{ width: 200 }}
        />
        <Button
          onClick={() => toaster.push(message, { placement })}
          appearance="primary">
          Push
        </Button>
        <Button onClick={() => toaster.remove()}>Remove</Button>
        <Button onClick={() => toaster.clear()}>Clear</Button>
      </ButtonToolbar>
    </div>
  );
};

// Mount the component to the DOM using createRoot
const container = document.getElementById("root"); // Get the root element
const root = ReactDOM.createRoot(container); // Create a root
root.render(<ToastifyCustom />); // Render the ToastifyCustom component
