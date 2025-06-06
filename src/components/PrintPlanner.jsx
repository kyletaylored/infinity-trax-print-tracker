import React, { useState, useRef } from "react";
import {
  Box,
  Heading,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Image,
  Flex,
  SimpleGrid,
  VStack,
  HStack,
  IconButton,
  Select,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";

import { FaCube, FaList, FaThLarge, FaTrash } from "react-icons/fa";
import partsList from "../data/parts-list.json";
import kits from "../data/kits.json";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect fill='%23e5e7eb' width='100%' height='100%' rx='12'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%23999'>🧩</text></svg>";

function PartImage({ src, alt, size = "56px" }) {
  const [error, setError] = React.useState(false);
  if (!src || error) {
    return (
      <Box
        boxSize={size}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="md"
        bg="gray.100"
      >
        <FaCube size={parseInt(size, 10) / 1.75} color="#BBB" />
      </Box>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      boxSize={size}
      objectFit="contain"
      borderRadius="md"
      onError={() => setError(true)}
    />
  );
}

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
            parents: [], // <-- now an array
          };
        }
        list[key].count += Number(qty);
        // Add parent with its contribution
        list[key].parents.push({ parent: part.name, count: Number(qty) });
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
    sp.parents && sp.parents.length > 0
      ? sp.parents.map((p) => `${p.parent} (${p.count})`).join("; ")
      : "",
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
  const [mode, setMode] = useState("list"); // "list" | "cards"
  const [partQtyInputs, setPartQtyInputs] = useState({});
  const [selectedParts, setSelectedParts] = useState({});
  const [showChecklist, setShowChecklist] = useState(false);
  const printList = buildPrintList(selectedParts);
  const [selectedKitId, setSelectedKitId] = useState("");
  const checklistRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleKitSelect = (kitId) => {
    setSelectedKitId(kitId);
    if (!kitId) {
      setSelectedParts({});
      return;
    }
    const kit = kits.find((k) => k.id === kitId);
    if (kit) {
      const newParts = {};
      kit.parts.forEach((p) => {
        newParts[p.part_id] = p.qty;
      });
      setSelectedParts(newParts);
    }
    setShowChecklist(false);
  };

  // -- Whenever you switch mode, close checklist
  const handleModeSwitch = (m) => {
    setMode(m);
    setShowChecklist(false); // <-- closes checklist
  };

  const handleQtyInputChange = (partId, qty) => {
    setPartQtyInputs((prev) => ({
      ...prev,
      [partId]: qty,
    }));
  };

  const handleAddPart = (partId) => {
    const qty = Number(partQtyInputs[partId]);
    if (!qty || qty < 1) return;
    setSelectedParts((prev) => ({
      ...prev,
      [partId]: (prev[partId] || 0) + qty,
    }));
    setPartQtyInputs((prev) => ({
      ...prev,
      [partId]: "",
    }));
    setShowChecklist(false); // <-- closes checklist
  };

  const handleListQtyChange = (id, qty) => {
    setSelectedParts((prev) => ({
      ...prev,
      [id]: Number(qty),
    }));
    setShowChecklist(false); // <-- closes checklist
  };

  const handleRemovePart = (partId) => {
    setSelectedParts((prev) => {
      const copy = { ...prev };
      delete copy[partId];
      return copy;
    });
    setShowChecklist(false); // <-- closes checklist
  };

  const handleClearAll = () => {
    setSelectedParts({});
    setShowChecklist(false); // <-- closes checklist
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
    <Box
      maxW="1200px"
      mx="auto"
      my={8}
      p={6}
      rounded="2xl"
      shadow="xl"
      bg="white"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Infinity Trax Print Planner</Heading>
        <HStack>
          <Button
            leftIcon={<FaList />}
            colorScheme={mode === "list" ? "blue" : "gray"}
            variant={mode === "list" ? "solid" : "outline"}
            onClick={() => handleModeSwitch("list")}
            size="sm"
          >
            List
          </Button>
          <Button
            leftIcon={<FaThLarge />}
            colorScheme={mode === "cards" ? "blue" : "gray"}
            variant={mode === "cards" ? "solid" : "outline"}
            onClick={() => handleModeSwitch("cards")}
            size="sm"
          >
            Cards
          </Button>
          <Button onClick={onOpen} size="sm" variant="outline" ml={2}>
            Show Debug JSON
          </Button>
        </HStack>
      </Flex>

      <Flex align="start" gap={8}>
        <Box flex="2">
          {mode === "list" ? (
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
                        <PartImage
                          src={part.image}
                          alt={part.name}
                          boxSize="56px"
                          objectFit="contain"
                          borderRadius="md"
                        />
                      ) : (
                        <Box
                          boxSize="56px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          borderRadius="md"
                          bg="gray.100"
                        >
                          <FaCube size={32} color="#BBB" />
                        </Box>
                      )}
                    </Td>
                    <Td fontWeight="semibold">{part.name}</Td>
                    <Td fontSize="sm" color="gray.500">
                      {part.metadata?.description}
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        min={0}
                        value={selectedParts[part.id] || ""}
                        onChange={(e) =>
                          handleListQtyChange(part.id, e.target.value)
                        }
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
          ) : (
            <SimpleGrid columns={[1, 2, 3]} spacing={6} mb={8}>
              {partsList.map((part) => (
                <Box
                  key={part.id}
                  borderWidth="1px"
                  rounded="xl"
                  shadow="sm"
                  p={4}
                  bg="gray.50"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                >
                  {part.image ? (
                    <PartImage
                      src={part.image}
                      alt={part.name}
                      boxSize="150px"
                      objectFit="contain"
                      borderRadius="md"
                      mb={2}
                    />
                  ) : (
                    <Box
                      boxSize="150px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="md"
                      bg="gray.100"
                      mb={2}
                    >
                      <FaCube size={48} color="#BBB" />
                    </Box>
                  )}
                  <Text fontWeight="semibold" mb={1}>
                    {part.name}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={3} textAlign="left">
                    {part.metadata?.description}
                  </Text>
                  <HStack>
                    <Input
                      type="number"
                      min={1}
                      value={partQtyInputs[part.id] || ""}
                      onChange={(e) =>
                        handleQtyInputChange(part.id, e.target.value)
                      }
                      width="64px"
                      placeholder="Qty"
                      size="sm"
                      bg="gray.50"
                    />
                    <Button
                      colorScheme="blue"
                      size="sm"
                      onClick={() => handleAddPart(part.id)}
                    >
                      Add
                    </Button>
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* Selected parts summary panel */}
        <Box flex="1" minW="260px" bg="gray.50" p={4} rounded="lg" shadow="md">
          <Heading as="h3" size="sm" mb={3}>
            Selected Parts
          </Heading>
          <Divider mb={3} />
          <Select
            placeholder="Choose a kit (optional)"
            value={selectedKitId}
            onChange={(e) => handleKitSelect(e.target.value)}
            width="320px"
            bg="white"
            size="sm"
            mb={3}
          >
            {kits.map((kit) => (
              <option key={kit.id} value={kit.id}>
                {kit.name}
              </option>
            ))}
            <option value="">Custom</option>
          </Select>
          <Divider mb={3} />
          {Object.keys(selectedParts).length === 0 ? (
            <Text color="gray.400" fontSize="sm">
              No parts selected yet.
            </Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              {Object.entries(selectedParts).map(([partId, qty]) => {
                const part = partsList.find((p) => p.id === partId);
                return (
                  <Flex key={partId} align="center" gap={2}>
                    {part?.image ? (
                      <PartImage
                        src={part.image}
                        alt={part.name}
                        boxSize="36px"
                        objectFit="contain"
                        borderRadius="md"
                      />
                    ) : (
                      <Box
                        boxSize="36px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius="md"
                        bg="gray.100"
                      >
                        <FaCube size={20} color="#BBB" />
                      </Box>
                    )}
                    <Box flex="1">
                      <Text fontWeight="semibold" fontSize="sm">
                        {part?.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {qty} to print
                      </Text>
                    </Box>
                    <Input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) =>
                        handleListQtyChange(partId, e.target.value)
                      }
                      width="52px"
                      size="xs"
                      bg="gray.100"
                    />
                    <IconButton
                      icon={<FaTrash />}
                      aria-label="Remove part"
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      ml={1}
                      onClick={() => handleRemovePart(partId)}
                    />
                  </Flex>
                );
              })}
            </VStack>
          )}
          <Divider my={4} />
          <Button
            colorScheme="blue"
            width="100%"
            isDisabled={Object.values(selectedParts).every((v) => !v || v < 1)}
            onClick={() => {
              setShowChecklist(true);
              setTimeout(() => {
                checklistRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 100); // Give React time to render
            }}
            mb={2}
          >
            Generate Print Checklist
          </Button>
          {Object.keys(selectedParts).length > 0 && (
            <Button
              width="100%"
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          )}
        </Box>
      </Flex>

      {/* Print Checklist */}
      {showChecklist && (
        <Box mt={8} ref={checklistRef}>
          <Heading size="md" mb={4}>
            Print Checklist
          </Heading>
          {printList.length === 0 ? (
            <Text>No parts selected.</Text>
          ) : (
            <>
              <Table size="sm" variant="striped" mt={2} mb={4}>
                <Thead>
                  <Tr>
                    <Th>Sub-Part</Th>
                    <Th isNumeric>Qty</Th>
                    <Th>Parent(s)</Th>
                    <Th>Support</Th>
                    <Th>Brim</Th>
                    <Th>Optional</Th>
                    <Th>Infill</Th>
                    <Th>Notes</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {printList.map((sp) => (
                    <Tr key={sp.parent + "-" + sp.name}>
                      <Td>{sp.name}</Td>
                      <Td isNumeric>{sp.count}</Td>
                      <Td>
                        {sp.parents?.map((p, i) => (
                          <span key={i}>
                            {p.parent}{" "}
                            <span style={{ color: "#999" }}>({p.count})</span>
                            {i < sp.parents.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </Td>
                      <Td textAlign="center">
                        {sp.metadata?.support ? "Yes" : ""}
                      </Td>
                      <Td textAlign="center">
                        {sp.metadata?.brim ? "Yes" : ""}
                      </Td>
                      <Td textAlign="center">
                        {sp.metadata?.optional ? "Yes" : ""}
                      </Td>
                      <Td>{sp.metadata?.infill || ""}</Td>
                      <Td>{sp.notes || ""}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <Button
                colorScheme="green"
                onClick={() => handleExportCSV(printList)}
              >
                Download as CSV
              </Button>
              <Button
                colorScheme="gray"
                ml={2}
                onClick={() =>
                  alert(
                    "To import in Google Sheets:\n1. Download the CSV.\n2. In Google Sheets, use File > Import > Upload."
                  )
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
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Debug JSON Viewer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Tabs isFitted variant="enclosed" colorScheme="blue">
              <TabList mb="1em">
                <Tab>Parts</Tab>
                <Tab>Kits</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Code
                    whiteSpace="pre"
                    width="100%"
                    maxH="60vh"
                    overflow="auto"
                    display="block"
                    fontSize="sm"
                    colorScheme="gray"
                    p={2}
                    borderRadius="md"
                    children={JSON.stringify(partsList, null, 2)}
                  />
                </TabPanel>
                <TabPanel>
                  <Code
                    whiteSpace="pre"
                    width="100%"
                    maxH="60vh"
                    overflow="auto"
                    display="block"
                    fontSize="sm"
                    colorScheme="gray"
                    p={2}
                    borderRadius="md"
                    children={JSON.stringify(kits, null, 2)}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
