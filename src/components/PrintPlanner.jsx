import React, { useState } from "react";
import {
  Box, Heading, Input, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Flex, Image
} from "@chakra-ui/react";
import { FaCube } from "react-icons/fa";
import partsList from "../data/parts-list.json";

// Placeholder image SVG (as a data URI)
const PLACEHOLDER_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect fill='%23e5e7eb' width='100%' height='100%' rx='12'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%23999'>🧩</text></svg>";

function buildPrintList(selectedParts) {
  const list = {};
  Object.entries(selectedParts).forEach(([partId, qty]) => {
    if (!qty || qty < 1) return;
    const part = partsList.find((p) => p.id === partId);
    if (part) {
      part.sub_parts.forEach((sp) => {
        const key = sp.name;
        if (!list[key]) {
          list[key] = {
            ...sp,
            count: 0,
            parent: part.name,
          };
        }
        list[key].count += Number(qty);
      });
    }
  });
  return Object.values(list);
}

function printListToCSV(printList) {
  const headers = [
    "Parent Part",
    "Sub-Part",
    "Quantity",
    "Support",
    "Brim",
    "Optional",
    "Infill",
    "Notes",
  ];
  const rows = printList.map((sp) => [
    sp.parent,
    sp.name,
    sp.count,
    sp.metadata?.support ? "Yes" : "",
    sp.metadata?.brim ? "Yes" : "",
    sp.metadata?.optional ? "Yes" : "",
    sp.metadata?.infill || "",
    sp.notes || "",
  ]);
  return [headers, ...rows]
    .map((row) => row.map((v) => `"${v || ""}"`).join(","))
    .join("\n");
}

export default function PrintPlanner() {
  const [selectedParts, setSelectedParts] = useState({});
  const [showChecklist, setShowChecklist] = useState(false);
  const printList = buildPrintList(selectedParts);

  const handleQtyChange = (id, qty) => {
    setSelectedParts((prev) => ({
      ...prev,
      [id]: Number(qty),
    }));
  };

  const handleExportCSV = (printList) => {
    const csv = printListToCSV(printList);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marble_run_print_list.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  return (
    <Box maxW="1100px" mx="auto" my={8} p={6} rounded="2xl" shadow="xl" bg="white">
      <Heading size="lg" mb={6}>Marble Run Print Planner</Heading>
      <Box as="form" onSubmit={e => { e.preventDefault(); setShowChecklist(true); }}>
        <Table size="sm" variant="simple" mb={8} bg="white">
          <Thead>
            <Tr>
              <Th w="80px">Image</Th>
              <Th>Part Name</Th>
              <Th>Description</Th>
              <Th w="100px">Quantity</Th>
            </Tr>
          </Thead>
          <Tbody>
            {partsList.map((part) => (
              <Tr key={part.id}>
                <Td>
                  {part.image ? (
                    <Image src={part.image} alt={part.name} boxSize="56px" objectFit="contain" borderRadius="md" />
                  ) : (
                    <Box boxSize="56px" display="flex" alignItems="center" justifyContent="center" borderRadius="md" bg="gray.100">
                      <FaCube size={32} color="#BBB" />
                    </Box>
                  )}
                </Td>
                <Td fontWeight="semibold">{part.name}</Td>
                <Td fontSize="sm" color="gray.500">{part.metadata?.description}</Td>
                <Td>
                  <Input
                    type="number"
                    min={0}
                    value={selectedParts[part.id] || ""}
                    onChange={(e) => handleQtyChange(part.id, e.target.value)}
                    width="80px"
                    placeholder="Qty"
                    size="sm"
                    bg="gray.50"
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Button
          colorScheme="blue"
          type="submit"
          isDisabled={Object.values(selectedParts).every((v) => !v || v < 1)}
          mb={6}
        >
          Generate Print Checklist
        </Button>
      </Box>

      {showChecklist && (
        <Box>
          <Heading size="md" mb={4}>Print Checklist</Heading>
          {printList.length === 0 ? (
            <Text>No parts selected.</Text>
          ) : (
            <>
              <Table size="sm" variant="striped" mt={2} mb={4}>
                <Thead>
                  <Tr>
                    <Th>Parent Part</Th>
                    <Th>Sub-Part</Th>
                    <Th isNumeric>Qty</Th>
                    <Th>Support</Th>
                    <Th>Brim</Th>
                    <Th>Optional</Th>
                    <Th>Infill</Th>
                    <Th>Notes</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {printList.map((sp) => (
                    <Tr key={sp.name}>
                      <Td>{sp.parent}</Td>
                      <Td>{sp.name}</Td>
                      <Td isNumeric>{sp.count}</Td>
                      <Td textAlign="center">{sp.metadata?.support ? "Yes" : ""}</Td>
                      <Td textAlign="center">{sp.metadata?.brim ? "Yes" : ""}</Td>
                      <Td textAlign="center">{sp.metadata?.optional ? "Yes" : ""}</Td>
                      <Td>{sp.metadata?.infill || ""}</Td>
                      <Td>{sp.notes || ""}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <Button colorScheme="green" onClick={() => handleExportCSV(printList)}>
                Download as CSV
              </Button>
              <Button
                colorScheme="gray"
                ml={2}
                onClick={() =>
                  alert("To import in Google Sheets:\n1. Download the CSV.\n2. In Google Sheets, use File > Import > Upload.")
                }
              >
                Import to Google Sheets
              </Button>
              <Button
                variant="link"
                ml={8}
                colorScheme="blue"
                onClick={() => setShowChecklist(false)}
              >
                Back to Planner
              </Button>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
