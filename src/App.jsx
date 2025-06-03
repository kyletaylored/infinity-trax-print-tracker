import React from "react";
import PrintPlanner from "./components/PrintPlanner";
import { Box } from "@chakra-ui/react";

export default function App() {
  return (
    <Box minH="100vh" bg="gray.100">
      <PrintPlanner />
    </Box>
  );
}
