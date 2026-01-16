import { useMemo, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";

import { useTranslation } from "react-i18next";
import { Alert } from "providers/AlertProvider";
import { useTheme } from "providers/ThemeProvider";
import ListItem from "components/List/ListItem";
import { useWorkOrderContext } from "store/workorder-context";
import Modal from "components/Modal/Modal";
import Button from "components/Button";
import ConfirmDialog from "components/Modal/ConfirmDialog";
import Chip from "components/Chip";
import Toggle from "components/Toggle";
import Badge from "components/Badge";
import StatusBadge from "components/StatusBadge";
import IconBadge from "components/IconBadge";
import Avatar from "components/Avatar";
import Title from "components/Typography";
import Card from "components/Card";
import Paper from "components/Paper";
import Accordion from "components/Accordion";
import Tabs from "components/Tab/Tabs";
import TabContent from "components/Tab/TabContent";
import LinearProgress from "components/Progress/LinearProgress";
import CircularProgress from "components/Progress/CircularProgress";
import Select from "components/Select";
import Checkbox from "components/Checkbox";
import ToggleButton from "components/ToggleButton/ToggleButton";
import ToggleButtonGroup from "components/ToggleButton/ToogleButtonGroup";
import FAB from "components/FAB";
import SpeedDial from "components/SpeedDial";
import Input from "components/Input";
import Spinner from "components/Spinner";
import NumericInput from "components/NumericInput";
import Divider from "components/Divider";

function Start() {
  const {
    workOrders,
    loadWorkOrders,
    addWorkOrder,
    deleteWorkOrder,
    updateWorkOrder,
  } = useWorkOrderContext();

  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selected, setSelected] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeTab2, setActiveTab2] = useState(0);
  const [checked, setChecked] = useState(false);
  const { t } = useTranslation();
  const [selectedValues, setSelectedValues] = useState([]);
  const [selectedValue, setSelectedValue] = useState();
  const [lang, setLang] = useState("en");
  const [search, setSearch] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [spinnerValue, setSpinnerValue] = useState(50);
  const [number, setNumber] = useState(0);

  useEffect(() => {
    async function load() {
      await loadWorkOrders();
    }
    load();
  }, []);

  const actions = [
    {
      id: 1,
      icon: "camera",
      label: "Take Photo",
      onPress: () => console.log("Photo"),
    },
    {
      id: 2,
      icon: "file-document",
      label: "Attach File",
      onPress: () => console.log("File"),
    },
    {
      id: 3,
      icon: "email",
      label: "Send Email",
      onPress: () => console.log("Email"),
    },
  ];

  return (
    <ScrollView>
      <View style={[styles.baseScreen, styles.container]}>
        <Title variant="displayMedium">TITOLO DI RIFERIMENTO</Title>
        <Button onPress={() => toggleTheme()} mode="outlined">
          Toggle Theme
        </Button>

        <SpeedDial actions={actions} mainIcon="pencil" />

        <FAB
          onPress={() => {
            Alert("FAB", "Premuto");
          }}
          icon="plus"
          position="top-right"
          label="FAB Test"
        />
        <Spinner
          label="spinner"
          value={spinnerValue}
          onChange={(val) => setSpinnerValue(val)}
          min={0}
          max={100}
          step={10}
        ></Spinner>
        <ToggleButton
          icon="apple"
          label="Apple"
          active={true}
          onPress={() => {}}
          isFirst={true}
        />
        <ToggleButton
          icon="apple"
          label="Apple"
          active={false}
          onPress={() => {}}
          isLast={true}
        />
        <Input
          label="Search"
          placeholder="Search your items..."
          value={search}
          variant="outlined"
          onChangeText={setSearch}
          leadingIcon="magnify"
          multiline={true}
          numberOfLines={4}
          minHeight={56}
        />
        <Divider>
          <Chip
            onClose={() => {}}
            label="test"
            icon="information"
            selected={selected}
            onPress={() => {
              setSelected(!selected);
            }}
          />
        </Divider>
        <View style={{ width: 150, height: 150 }}>
          <NumericInput
            variant="filled"
            precision={2}
            prefix="€"
            label="Numero"
            placeholder="Inserisci l'importo..."
            value={number}
            variant="outlined"
            onChangeText={setNumber}
            error={number > 100 ? "numero troppo grande" : ""}
          />
        </View>
        <Input
          variant="filled"
          label="Password"
          secureTextEntry={!showPass}
          value={password}
          onChangeText={setPassword}
          trailingIcon={showPass ? "eye-off" : "eye"}
          onTrailingIconPress={() => setShowPass(!showPass)}
          error={password.length < 8 ? "Password too short" : ""}
        />

        <ToggleButtonGroup
          value={lang}
          onValueChange={setLang}
          multiSelect={true}
          options={[
            { label: "EN", value: "en", icon: "translate" },
            { label: "IT", value: "it", icon: "translate" },
            { label: "ES", value: "es", icon: "translate" },
          ]}
        />

        <Select
          label="campo select"
          options={[
            { id: "0", value: null, label: "---" },
            {
              id: "1",
              value: "option1",
              label: "Option 1",
              icon: "information",
            },
            {
              id: "2",
              value: "option2",
              label: "Option 2",
              icon: "api",
            },
            { id: "3", value: "option3", label: "Option 3", icon: "apple" },
          ]}
          onSelect={(val) => setSelectedValue(val)}
          placeholder="Seleziona un'opzione"
          disabled={false}
          variant="outline"
          value={selectedValue}
          style={{ width: "50%" }}
        />
        <Select
          label="campo select"
          options={[
            {
              id: "1",
              value: "option1",
              label: "Option 1",
              icon: "information",
            },
            {
              id: "2",
              value: "option2",
              label: "Option 2",
              icon: "translation",
            },
            { id: "3", value: "option3", label: "Option 3" },
            { id: "4", value: "option4", label: "Option 4" },
            { id: "5", value: "option5", label: "Option 5" },
            { id: "6", value: "option6", label: "Option 6" },
          ]}
          onSelect={(val) => console.log(val)}
          placeholder="Seleziona un'opzione"
          disabled={false}
          variant="filled"
          value={null}
          style={{ width: "30%" }}
          multiSelect={true}
          selectedValues={selectedValues}
          showAsChips={true}
          toggleOptions={(val) => setSelectedValues(val)}
        />
        <Checkbox
          label="prova checkbox"
          checked={checked}
          onValueChange={() => {
            setChecked(!checked);
          }}
          labelPosition="right"
        />

        <Card onPress={() => {}} variant="outlined">
          <Title variant="displaySmall">displaySmall</Title>
          <Title variant="titleLarge">titleLarge</Title>
        </Card>
        <Paper>
          <Title variant="displaySmall">displaySmall</Title>
        </Paper>
        <Accordion
          title="Accordion"
          onPress={() => {}}
          startExpanded={true}
          titleStyle={{ fontSize: 24 }}
        >
          <Title variant="displaySmall">displaySmall</Title>
        </Accordion>
        <LinearProgress progress={95} indeterminate={true}></LinearProgress>
        <CircularProgress />
        <Tabs
          tabs={[
            { label: "Home", icon: "home" },
            { label: "Search", icon: "magnify" },
            { label: "Profile", icon: "account" },
          ]}
          activeTab={activeTab}
          onChange={(index) => setActiveTab(index)}
        ></Tabs>
        <Tabs
          tabs={["Home", "Search", "Profile"]}
          activeTab={activeTab2}
          onChange={(index) => setActiveTab2(index)}
        ></Tabs>
        <TabContent activeTab={activeTab2}>
          <Title variant="displaySmall">displaySmall 1</Title>
          <Title variant="displaySmall">displaySmall 2 </Title>
          <Title variant="displaySmall">displaySmall 3</Title>
        </TabContent>
        <Button
          iconName="plus"
          onPress={() => Alert("Icon button", "Premuto")}
          loading={true}
        >
          {t("ADD")}
        </Button>
        <Button
          iconName="minus"
          mode="tonal"
          onPress={() => setConfirmVisible(true)}
        />
        <Modal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
          }}
        >
          This is a modal!
        </Modal>
        <ConfirmDialog
          visible={confirmVisible}
          title="Confirm Delete"
          message="Are you sure you want to delete this item?"
          onConfirm={() => {
            setConfirmVisible(false);
          }}
          onCancel={() => {
            setConfirmVisible(false);
          }}
        />
        <View style={{ flexDirection: "row" }}>
          <Chip
            onClose={() => {}}
            label="test"
            icon="information"
            selected={selected}
            onPress={() => {
              setSelected(!selected);
            }}
          />
          <Chip
            onClose={() => {}}
            label="test"
            icon="information"
            selected={selected}
            onPress={() => {
              setSelected(!selected);
            }}
          />
        </View>
        <Toggle value={selected} onValueChange={() => setSelected(!selected)} />
        <Badge count={2}></Badge>
        <StatusBadge />
        <IconBadge
          iconName="information"
          badgeCount={99}
          onPress={() => Alert("IconBadge", "Premuto")}
        />
        <Avatar
          onPress={() => Alert("Avatar", "Premuto")}
          status="online"
          name="Adriano Buscema"
        />

        <FlatList
          style={{ width: "100%" }}
          data={workOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListItem
              itemTextStyle={{ textAlign: "left" }}
              onPress={() => {
                Alert("Work Order", `You selected work order ${item.title}`);
              }}
            >
              {item.title}
            </ListItem>
          )}
        />
      </View>
    </ScrollView>
  );
}

export default Start;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    baseScreen: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.m,
    },
    container: {
      alignItems: "center",
      justifyContent: "center",
    },
  });
