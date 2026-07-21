import React from 'react';
import { Modal, ModalProps } from 'react-native';

/**
 * AppModal — thin wrapper around React Native's Modal.
 * Defaults statusBarTranslucent and navigationBarTranslucent to true
 * for correct edge-to-edge behaviour on Android.
 */
const AppModal: React.FC<ModalProps> = ({
  statusBarTranslucent = true,
  navigationBarTranslucent = true,
  ...props
}) => {
  return (
    <Modal
      statusBarTranslucent={statusBarTranslucent}
      navigationBarTranslucent={navigationBarTranslucent}
      {...props}
    />
  );
};

export default AppModal;
